import { legalInfo } from "@/lib/legal-info";

export default function () {
  return (
    <article>
      <h1>Contact</h1>
      <p>
        For questions or suggestions of this website, email{" "}
        {legalInfo.contactEmail ? (
          <a href={`mailto:${legalInfo.contactEmail}`}>{legalInfo.contactEmail}</a>
        ) : "[Set LEGAL_INFO_CONTACT_EMAIL]"}.
      </p>
    </article>
  );
}
