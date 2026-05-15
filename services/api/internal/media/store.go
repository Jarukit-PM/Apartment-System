package media

import (
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ErrInvalidType is returned for disallowed content types.
var ErrInvalidType = errors.New("unsupported image type")

// ErrTooLarge is returned when the upload exceeds the configured limit.
var ErrTooLarge = errors.New("image too large")

// ErrInvalidName is returned for unsafe filenames.
var ErrInvalidName = errors.New("invalid media filename")

var extByType = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

// Store saves uploaded images on disk and serves them by basename.
type Store struct {
	dir      string
	maxBytes int64
}

// NewStore creates a media store, ensuring the directory exists.
func NewStore(dir string, maxBytes int64) (*Store, error) {
	dir = strings.TrimSpace(dir)
	if dir == "" {
		dir = "uploads"
	}
	if maxBytes <= 0 {
		maxBytes = 5 << 20
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	return &Store{dir: dir, maxBytes: maxBytes}, nil
}

// MaxBytes returns the configured upload limit.
func (s *Store) MaxBytes() int64 {
	return s.maxBytes
}

// Save writes an uploaded image and returns its public path (e.g. /media/uuid.jpg).
func (s *Store) Save(r io.Reader, declaredType string, size int64) (string, error) {
	if size > s.maxBytes {
		return "", ErrTooLarge
	}
	ct := strings.ToLower(strings.TrimSpace(strings.Split(declaredType, ";")[0]))
	ext, ok := extByType[ct]
	if !ok {
		return "", ErrInvalidType
	}
	name := primitive.NewObjectID().Hex() + ext
	path := filepath.Join(s.dir, name)
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", err
	}
	defer f.Close()

	limited := io.LimitReader(r, s.maxBytes+1)
	n, err := io.Copy(f, limited)
	if err != nil {
		_ = os.Remove(path)
		return "", err
	}
	if n > s.maxBytes {
		_ = os.Remove(path)
		return "", ErrTooLarge
	}
	return "/media/" + name, nil
}

// Open returns a file for serving. name must be a basename only.
func (s *Store) Open(name string) (*os.File, error) {
	if err := ValidateBasename(name); err != nil {
		return nil, err
	}
	return os.Open(filepath.Join(s.dir, name))
}

// ValidateBasename ensures a filename is safe for serving.
func ValidateBasename(name string) error {
	name = strings.TrimSpace(name)
	if name == "" || name != filepath.Base(name) {
		return ErrInvalidName
	}
	if strings.Contains(name, "..") || strings.ContainsAny(name, `/\`) {
		return ErrInvalidName
	}
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif":
		return nil
	default:
		return ErrInvalidName
	}
}

// ValidatePublicPath ensures imageUrl values stored on entities point at this API.
func ValidatePublicPath(path string) error {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil
	}
	if !strings.HasPrefix(path, "/media/") {
		return fmt.Errorf("imageUrl must start with /media/")
	}
	return ValidateBasename(strings.TrimPrefix(path, "/media/"))
}

// ContentTypeForName returns the MIME type for a stored basename.
func ContentTypeForName(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	default:
		return mime.TypeByExtension(ext)
	}
}

// ServeFile writes a stored image to w.
func (s *Store) ServeFile(w http.ResponseWriter, r *http.Request, name string) error {
	if err := ValidateBasename(name); err != nil {
		return err
	}
	f, err := s.Open(name)
	if err != nil {
		if os.IsNotExist(err) {
			return os.ErrNotExist
		}
		return err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", ContentTypeForName(name))
	w.Header().Set("Cache-Control", "public, max-age=86400")
	http.ServeContent(w, r, name, info.ModTime(), f)
	return nil
}
