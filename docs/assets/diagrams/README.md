# Diagram assets for Word report

PNG files rendered from Mermaid via [Kroki](https://kroki.io). Source: `*.mmd` in this folder.

| File | Used in report section |
|------|------------------------|
| `mindmap-cap.png` | §1 Requirement — capabilities mindmap |
| `use-cases.png` | §1.5 Use cases |
| `containers.png` | §2.2 C4 containers |
| `go-layers.png` | §2.3 Go API layering |
| `er-model.png` | §2.4 Data model ER |
| `billing-flow.png` | §3.3 Billing job |
| `solution-flow.png` | §4.3 Solution approach |
| `lease-flow.png` | §5.2 Resident booking sequence |
| `admin-flow.png` | §5.3 Admin flow |
| `mvp-pie.png` | §7.1 MVP coverage pie |

Regenerate PNGs:

```bash
cd docs/assets/diagrams
for f in *.mmd; do
  curl -sS -X POST https://kroki.io/mermaid/png \
    -H "Content-Type: text/plain" \
    --data-binary @"$f" -o "${f%.mmd}.png"
done
```

Regenerate Word:

```bash
cd scripts/docx-build && node generate-presentation-docx.mjs
```
