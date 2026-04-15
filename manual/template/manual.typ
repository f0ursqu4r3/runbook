#let runbook_primary = rgb("#0f172a")
#let runbook_accent = rgb("#d97706")
#let runbook_muted = rgb("#475569")

#set page(
  paper: "us-letter",
  margin: (x: 0.9in, y: 0.75in),
  footer: context {
    let page-number = counter(page).display("1")
    align(center, text(size: 9pt, fill: runbook_muted)[#page-number])
  },
)

#set text(
  font: "New Computer Modern",
  size: 11pt,
  fill: runbook_primary,
)

#show heading.where(level: 1): it => block(above: 1.8em, below: 0.8em)[
  #text(20pt, weight: "bold", fill: runbook_primary)[#it.body]
]

#show heading.where(level: 2): it => block(above: 1.2em, below: 0.6em)[
  #text(14pt, weight: "semibold", fill: runbook_primary)[#it.body]
]

#let runbook_cover(title, version, generated_at, logo_path) = [
  #align(center)[
    #v(2.2cm)
    #image(logo_path, width: 2.8in)
    #v(0.8cm)
    #text(26pt, weight: "bold", fill: runbook_primary)[#title]
    #v(0.35cm)
    #text(11pt, fill: runbook_muted)[Version #version]
    #line(length: 2.8in, stroke: (paint: runbook_accent, thickness: 1.4pt))
    #v(0.25cm)
    #text(10pt, fill: runbook_muted)[Generated #generated_at]
  ]
]

#let runbook_figure(image_path, caption: none) = {
  let body = image(image_path, width: 100%)
  if caption == none {
    figure(body)
  } else {
    figure(body, caption: caption)
  }
}
