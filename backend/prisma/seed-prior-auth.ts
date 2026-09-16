/**
 * Seeds SAMPLE prior-auth criteria documents for the public evaluation demo.
 *
 * Usage (prod DATABASE_URL from the Render dashboard):
 *   DATABASE_URL="postgresql://..." npx ts-node prisma/seed-prior-auth.ts
 *
 * All content is synthetic SAMPLE data for evaluation only — not medical advice.
 * Company id must match frontend/app/prior-auth/page.tsx COMPANY_ID.
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const COMPANY_ID = '85a535c5-2a12-4cef-977e-29f436bbb3f5';

const DOCS: { title: string; content: string }[] = [
  {
    title: 'SAMPLE: MRI Lumbar Spine Criteria (evaluation only)',
    content: `SAMPLE CRITERIA — MRI LUMBAR SPINE WITHOUT CONTRAST (evaluation only, not medical advice).

Criterion M-1 (conservative care first): Lumbar MRI without contrast is medically appropriate after at least 6 weeks of supervised conservative treatment (physical therapy, NSAIDs, activity modification) with documented inadequate response. See page 2, section Conservative Care.

Criterion M-2 (red flags override): MRI is appropriate WITHOUT the 6-week wait when red-flag symptoms are documented: progressive neurologic deficit, saddle anesthesia, bowel/bladder dysfunction, history of cancer with new back pain, suspected infection with fever, or major trauma. See page 3, section Red Flags.

Criterion M-3 (ordering specialty): Initial requests from family medicine or internal medicine require documented conservative-care trial unless M-2 applies. Direct specialist (orthopedics, neurology, neurosurgery) ordering still requires M-1 or M-2. See page 4, section Ordering Rules.

Criterion M-4 (documentation required): The request must state pain duration in weeks, prior treatments with dates, neurologic exam findings, and red-flag review. Missing any element routes to exception queue for more information. See page 5, section Documentation.

Worked example: 45-year-old, low back pain 4 weeks, no red flags documented, no conservative treatment on file, ordered by family medicine. Evaluation: M-1 NOT met (only 4 of 6 weeks, no conservative care documented). M-2 NOT met (no red flags documented). M-3 applies (family medicine ordering). M-4 NOT met (missing conservative-care dates and neuro exam). Recommendation: needs more information — request 2 additional weeks of supervised conservative care with dates, plus documented neurologic exam and red-flag review, then re-evaluate.`,
  },
  {
    title: 'SAMPLE: Biologic Therapy Criteria (evaluation only)',
    content: `SAMPLE CRITERIA — BIOLOGIC THERAPY STEP PROTOCOL (evaluation only, not medical advice).

Criterion B-1 (confirmed diagnosis): Diagnosis must be confirmed by rheumatology with supporting labs: elevated CRP or ESR documented. See page 1, section Diagnosis.

Criterion B-2 (infection screening): Active tuberculosis must be ruled out (TB screen negative) before biologic initiation. Positive screen routes to infectious disease review. See page 2, section Safety Screening.

Criterion B-3 (step therapy): Documented trial and failure of at least TWO conventional DMARDs (e.g., methotrexate minimum 3 months, sulfasalazine minimum 3 months) unless contraindication is documented with rationale. See page 3, section Step Therapy.

Criterion B-4 (specialist attachment): Current rheumatology notes must be attached showing ongoing specialist management. See page 4, section Documentation.

Worked example: rheumatology-confirmed diagnosis, elevated CRP/ESR, TB screen negative, failed methotrexate 6 months and sulfasalazine 4 months, specialist notes attached. Evaluation: B-1 met, B-2 met, B-3 met (two DMARDs, adequate durations), B-4 met. Recommendation: approve — all criteria satisfied with citations above.`,
  },
  {
    title: 'SAMPLE: Referral Review Criteria (evaluation only)',
    content: `SAMPLE CRITERIA — SPECIALTY REFERRAL ROUTING (evaluation only, not medical advice).

Criterion R-1 (urgency required): Every referral must state an urgency level: emergent (same day), urgent (within 7 days), or routine (within 30 days). Referrals without urgency go to the exception queue, never auto-routed. See page 1, section Triage.

Criterion R-2 (cardiac workup): Cardiology referrals for chest discomfort must attach a recent ECG (within 30 days). Missing ECG routes to exception queue with a request back to the referring provider. Stable patients without ECG default to routine pending workup. See page 2, section Cardiac Requirements.

Criterion R-3 (routing): Complete cardiology referrals route to general cardiology scheduling; incomplete ones route to the exception queue with the specific missing items listed. See page 3, section Routing.

Worked example: cardiology referral for intermittent chest discomfort, history included, no urgency stated, no recent ECG attached, patient stable. Evaluation: R-1 NOT met (no urgency). R-2 NOT met (no ECG). Recommendation: exception queue — request urgency level and ECG within 30 days from referring provider; default routine once complete.`,
  },
];

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  const db = new PrismaClient();
  try {
    for (const doc of DOCS) {
      const existing = await db.document.findFirst({
        where: { companyId: COMPANY_ID, title: doc.title },
      });
      const record = existing
        ? await db.document.update({
            where: { id: existing.id },
            data: { content: doc.content, status: 'ready', published: true },
          })
        : await db.document.create({
            data: {
              id: crypto.randomUUID(),
              companyId: COMPANY_ID,
              title: doc.title,
              content: doc.content,
              status: 'ready',
              published: true,
              pageCount: 1,
            },
          });
      await db.$executeRaw`DELETE FROM chunks WHERE document_id = ${record.id}`;
      const chunks = chunkText(doc.content);
      for (let i = 0; i < chunks.length; i++) {
        await db.$executeRaw`
          INSERT INTO chunks (id, document_id, company_id, chunk_index, chunk_text, embedding)
          VALUES (${crypto.randomUUID()}, ${record.id}, ${COMPANY_ID}, ${i}, ${chunks[i]}, NULL::vector)
        `;
      }
      console.log(`Seeded: ${doc.title} (${chunks.length} chunks)`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
