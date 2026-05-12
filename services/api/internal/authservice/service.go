package authservice

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/jarukit/apartment-system/services/api/internal/jwtx"
	"github.com/jarukit/apartment-system/services/api/internal/refreshtoken"
	"github.com/jarukit/apartment-system/services/api/internal/resident"
	"github.com/jarukit/apartment-system/services/api/internal/user"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
)

// ErrInvalidCredentials for failed login.
var ErrInvalidCredentials = errors.New("invalid email or password")

// ErrInvalidRefresh when refresh token unknown or expired.
var ErrInvalidRefresh = errors.New("invalid or expired refresh token")

// ErrWeakPassword when policy fails.
var ErrWeakPassword = errors.New("password must be at least 8 characters")

// ErrEmailTaken when register duplicates email.
var ErrEmailTaken = errors.New("email already registered")

// ErrOAuth when Google token invalid.
var ErrOAuth = errors.New("google sign-in failed")

// AuthConfig is JWT and refresh behaviour.
type AuthConfig struct {
	JWTSecret  []byte
	AccessTTL  time.Duration
	RefreshTTL time.Duration
	GoogleAud  string // audience for Google ID token verification; empty disables OAuth
	BcryptCost int
}

// Service issues credentials and manages users.
type Service struct {
	cfg       AuthConfig
	users     *user.Repo
	refresh   *refreshtoken.Repo
	residents *resident.Service
}

// NewService constructs the auth service.
func NewService(cfg AuthConfig, users *user.Repo, rt *refreshtoken.Repo, res *resident.Service) *Service {
	c := cfg.BcryptCost
	if c == 0 {
		c = bcrypt.DefaultCost
	}
	cfg.BcryptCost = c
	return &Service{cfg: cfg, users: users, refresh: rt, residents: res}
}

// UserView is returned to clients after auth.
type UserView struct {
	ID         string   `json:"id"`
	Email      string   `json:"email"`
	Roles      []string `json:"roles"`
	ResidentID *string  `json:"residentId,omitempty"`
}

// TokenPair is returned on login/register/refresh/oauth.
type TokenPair struct {
	AccessToken  string   `json:"accessToken"`
	RefreshToken string   `json:"refreshToken"`
	ExpiresIn    int64    `json:"expiresIn"`
	User         UserView `json:"user"`
}

func viewFromUser(d *user.Doc) UserView {
	v := UserView{
		ID:    d.ID.Hex(),
		Email: d.Email,
		Roles: append([]string(nil), d.Roles...),
	}
	if d.ResidentID != nil {
		h := d.ResidentID.Hex()
		v.ResidentID = &h
	}
	return v
}

func (s *Service) mintPair(ctx context.Context, d *user.Doc) (*TokenPair, error) {
	access, err := jwtx.SignAccess(s.cfg.JWTSecret, d.ID, d.Email, d.Roles, d.ResidentID, s.cfg.AccessTTL)
	if err != nil {
		return nil, err
	}
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return nil, err
	}
	rt := hex.EncodeToString(raw)
	hash := refreshtoken.Hash(rt)
	exp := time.Now().UTC().Add(s.cfg.RefreshTTL)
	if err := s.refresh.Insert(ctx, d.ID, hash, exp); err != nil {
		return nil, err
	}
	return &TokenPair{
		AccessToken:  access,
		RefreshToken: rt,
		ExpiresIn:    int64(s.cfg.AccessTTL / time.Second),
		User:         viewFromUser(d),
	}, nil
}

// RegisterResident creates a resident profile and a password user in one step.
func (s *Service) RegisterResident(ctx context.Context, email, password, fullName, phone string) (*TokenPair, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	fullName = strings.TrimSpace(fullName)
	phone = strings.TrimSpace(phone)
	if email == "" || fullName == "" {
		return nil, errors.New("email and fullName are required")
	}
	if len(password) < 8 {
		return nil, ErrWeakPassword
	}
	if _, err := s.users.GetByEmail(ctx, email); err == nil {
		return nil, ErrEmailTaken
	} else if !errors.Is(err, user.ErrNotFound) {
		return nil, err
	}
	res, err := s.residents.Create(ctx, resident.CreateInput{
		FullName: fullName,
		Email:    email,
		Phone:    phone,
	})
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.cfg.BcryptCost)
	if err != nil {
		return nil, err
	}
	u := &user.Doc{
		Email:        email,
		PasswordHash: string(hash),
		Roles:        []string{user.RoleResident},
		ResidentID:   &res.ID,
	}
	if err := s.users.Insert(ctx, u); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	loaded, err := s.users.GetByID(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	return s.mintPair(ctx, loaded)
}

// Login with email and password.
func (s *Service) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	d, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if d.PasswordHash == "" {
		return nil, ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(d.PasswordHash), []byte(password)) != nil {
		return nil, ErrInvalidCredentials
	}
	return s.mintPair(ctx, d)
}

// Refresh rotates refresh token and returns a new pair.
func (s *Service) Refresh(ctx context.Context, rawRefresh string) (*TokenPair, error) {
	rawRefresh = strings.TrimSpace(rawRefresh)
	if rawRefresh == "" {
		return nil, ErrInvalidRefresh
	}
	h := refreshtoken.Hash(rawRefresh)
	uid, err := s.refresh.FindUserByValidToken(ctx, h)
	if err != nil {
		return nil, ErrInvalidRefresh
	}
	_ = s.refresh.DeleteByHash(ctx, h)
	d, err := s.users.GetByID(ctx, uid)
	if err != nil {
		return nil, ErrInvalidRefresh
	}
	return s.mintPair(ctx, d)
}

// Logout removes a refresh token row.
func (s *Service) Logout(ctx context.Context, rawRefresh string) error {
	rawRefresh = strings.TrimSpace(rawRefresh)
	if rawRefresh == "" {
		return nil
	}
	return s.refresh.DeleteByHash(ctx, refreshtoken.Hash(rawRefresh))
}

// OAuthGoogle validates a Google ID token and signs the user in (linking or creating a resident).
func (s *Service) OAuthGoogle(ctx context.Context, idToken string) (*TokenPair, error) {
	if strings.TrimSpace(s.cfg.GoogleAud) == "" {
		return nil, ErrOAuth
	}
	payload, err := idtoken.Validate(ctx, idToken, s.cfg.GoogleAud)
	if err != nil {
		return nil, ErrOAuth
	}
	email, _ := payload.Claims["email"].(string)
	email = strings.TrimSpace(strings.ToLower(email))
	name, _ := payload.Claims["name"].(string)
	if email == "" {
		return nil, ErrOAuth
	}
	if strings.TrimSpace(name) == "" {
		name = email
	}
	sub := payload.Subject
	if sub == "" {
		return nil, ErrOAuth
	}
	if d, err := s.users.GetByGoogleSub(ctx, sub); err == nil {
		return s.mintPair(ctx, d)
	} else if !errors.Is(err, user.ErrNotFound) {
		return nil, err
	}
	if d, err := s.users.GetByEmail(ctx, email); err == nil {
		if err := s.users.SetGoogleSub(ctx, d.ID, sub); err != nil {
			return nil, err
		}
		d2, err := s.users.GetByID(ctx, d.ID)
		if err != nil {
			return nil, err
		}
		return s.mintPair(ctx, d2)
	} else if !errors.Is(err, user.ErrNotFound) {
		return nil, err
	}
	res, err := s.residents.Create(ctx, resident.CreateInput{
		FullName: strings.TrimSpace(name),
		Email:    email,
	})
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			existing, e2 := s.residents.GetByEmail(ctx, email)
			if e2 != nil {
				return nil, e2
			}
			u := &user.Doc{
				Email:      email,
				GoogleSub:  sub,
				Roles:      []string{user.RoleResident},
				ResidentID: &existing.ID,
			}
			if err := s.users.Insert(ctx, u); err != nil {
				return nil, err
			}
			d2, err := s.users.GetByID(ctx, u.ID)
			if err != nil {
				return nil, err
			}
			return s.mintPair(ctx, d2)
		}
		return nil, err
	}
	u := &user.Doc{
		Email:      email,
		GoogleSub:  sub,
		Roles:      []string{user.RoleResident},
		ResidentID: &res.ID,
	}
	if err := s.users.Insert(ctx, u); err != nil {
		return nil, err
	}
	d2, err := s.users.GetByID(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	return s.mintPair(ctx, d2)
}

// EnsureBootstrapAdmin creates an admin user when env vars are set and the email is unused.
func (s *Service) EnsureBootstrapAdmin(ctx context.Context, email, password string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	password = strings.TrimSpace(password)
	if email == "" || password == "" {
		return nil
	}
	if _, err := s.users.GetByEmail(ctx, email); err == nil {
		return nil
	} else if !errors.Is(err, user.ErrNotFound) {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.cfg.BcryptCost)
	if err != nil {
		return err
	}
	u := &user.Doc{
		Email:        email,
		PasswordHash: string(hash),
		Roles:        []string{user.RoleAdmin},
	}
	return s.users.Insert(ctx, u)
}
