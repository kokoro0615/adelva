import { PageHero } from "@/components/hero";
import { MotionStage } from "@/components/motion-stage";
import { CallToActionBand, SectionView } from "@/components/sections";
import type { PageDocument } from "@/content/types";
import { templateFor } from "@/lib/templates";

/**
 * One data-driven renderer for all fourteen rendered template families.
 *
 * The template is chosen from the exact manifest `family`, never from a
 * pathname substring, and the ordered `sections` array owns the page rhythm:
 * hero, editorial statement, alternating stories, facts or sequence, banner,
 * related rail, owner-supplied record, then a restrained call to action.
 */
export function RouteDocument({ document }: { readonly document: PageDocument }) {
  const template = templateFor(document.family);

  return (
    <MotionStage>
      <PageHero
        hero={document.hero}
        template={template}
        currentPath={document.path}
        anchorId={document.sections[0]?.id}
      />

      <>
        {document.sections.map((section, index) => (
          <SectionView
            key={section.id}
            section={section}
            primary={index === 0}
            panelled={template.overlapPanel}
            lifted={template.overlapPanel && index === 0}
          />
        ))}
        {document.cta ? (
          <CallToActionBand cta={document.cta} panelled={template.overlapPanel} />
        ) : null}
      </>
    </MotionStage>
  );
}
