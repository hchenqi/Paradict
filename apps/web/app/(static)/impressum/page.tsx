import { legalInfo } from "@/lib/legal-info";

export default function LegalNoticePage() {
  return (
    <article>
      <h1>Legal Notice</h1>
      <p>
        Service provider information under section 5 of the German Digital
        Services Act (DDG).
      </p>
      <p>
        <strong>Service provider</strong>
        <br />
        {legalInfo.name || "[Set LEGAL_INFO_NAME]"}
        <br />
        {legalInfo.address?.split(/\r?\n/).map((line, index) => (
          <span key={line + index}>
            {line}
            <br />
          </span>
        )) || "[Set LEGAL_INFO_ADDRESS]"}
      </p>
      <p>
        <strong>Contact</strong>
        <br />
        Email: {legalInfo.contactEmail ? (
          <a href={`mailto:${legalInfo.contactEmail}`}>{legalInfo.contactEmail}</a>
        ) : "[Set LEGAL_INFO_CONTACT_EMAIL]"}
      </p>
      {(legalInfo.registerDetails || legalInfo.vatId) && (
        <p>
          {legalInfo.registerDetails && <>Register details: {legalInfo.registerDetails}<br /></>}
          {legalInfo.vatId && <>VAT identification number: {legalInfo.vatId}</>}
        </p>
      )}
    </article>
  );
}
