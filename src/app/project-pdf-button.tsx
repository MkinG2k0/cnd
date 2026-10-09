export function ProjectPdfButton({
  name,
  href,
}: {
  name: string;
  href: string;
}) {
  return (
    <a
      className="button outline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Показать проект ${name}`}
    >
      Показать проект <span aria-hidden="true">↗</span>
    </a>
  );
}
