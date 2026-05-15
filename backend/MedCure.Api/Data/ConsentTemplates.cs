namespace MedCure.Api.Data;

public static class ConsentTemplates
{
    public sealed record ConsentTemplate(string Kind, string Title, string BodyText, bool RequiredWitness);

    public static ConsentTemplate BasicTreatment() => new(
        "treatment",
        "Consent for medical evaluation and treatment",
        """
        I voluntarily consent to medical evaluation, diagnostic tests, and treatment as deemed appropriate by the medical staff of this facility.

        I understand that the practice of medicine is not an exact science and that diagnosis and treatment may involve risks of injury, complications, or even death. I acknowledge that no guarantees have been made to me regarding the result of evaluation or treatment.

        I authorize this facility, its physicians, and staff to administer such routine care, examinations, anesthetics, medications, and procedures as may be advisable in the judgment of the attending physicians.

        I authorize the release of medical information necessary to process insurance claims and for continuity of care with other treating providers.

        I acknowledge financial responsibility for charges not covered by my insurance.
        """,
        false);

    public static ConsentTemplate Procedure(string procedureName) => new(
        "procedure",
        $"Informed consent for {procedureName}",
        $"""
        I, the undersigned, consent to the following procedure: {procedureName}.

        The nature, purpose, benefits, risks, and reasonable alternatives (including no treatment) have been explained to me by my physician. I have had the opportunity to ask questions and all my questions have been answered to my satisfaction.

        Recognized risks include but are not limited to: bleeding, infection, adverse reaction to anesthesia, injury to adjacent structures, and the possibility that additional or different procedures may be required.

        I understand that during the course of the procedure, unforeseen conditions may arise that necessitate procedures different from or in addition to those contemplated. I authorize my physician and assistants to perform such additional procedures as are deemed necessary or desirable in their professional judgment.

        I consent to the administration of anesthesia by qualified personnel and to the disposal of any tissues or specimens removed during the procedure.
        """,
        true);

    public static ConsentTemplate PhotoRelease() => new(
        "photo",
        "Authorization for photography, video, and imaging",
        """
        I authorize this facility and its designated personnel to photograph, video record, or otherwise capture images of me or any portion of my body for the purposes indicated below.

        Purpose: medical documentation, education and training of healthcare personnel, scientific publication, and quality improvement activities.

        I understand that images used outside of my medical record for education or publication will be de-identified to the extent reasonably possible. I may withdraw this authorization in writing at any time, except to the extent that action has already been taken in reliance upon it.

        I waive any right to inspect or approve the finished images or the use to which they may be applied within the scope of this authorization.
        """,
        true);

    public static ConsentTemplate ResearchParticipation() => new(
        "research",
        "Informed consent for research participation",
        """
        You are being asked to participate in a research study. Participation is entirely voluntary.

        The purpose, procedures, expected duration, foreseeable risks and discomforts, potential benefits, alternatives, and confidentiality protections of the study have been explained to me. I have received a copy of the full consent document and have had time to consider my decision.

        I understand that I may refuse to participate or withdraw from the study at any time without penalty or loss of benefits to which I am otherwise entitled. My decision will not affect my medical care.

        I authorize the research team to access my medical records as described in the protocol and to share de-identified data with collaborators and regulatory authorities as required.

        I have been informed of whom to contact with questions about the research and my rights as a participant.
        """,
        true);

    public static ConsentTemplate HipaaNotice() => new(
        "hipaa",
        "Acknowledgement of Notice of Privacy Practices (HIPAA)",
        """
        I acknowledge that I have been offered a copy of this facility's Notice of Privacy Practices, which describes how my protected health information (PHI) may be used and disclosed and how I can obtain access to this information.

        I authorize the use and disclosure of my PHI for purposes of treatment, payment, and healthcare operations as permitted by 45 CFR 164.506.

        I understand that I have the right to request restrictions on certain uses and disclosures, to inspect and copy my records, to request amendments, and to receive an accounting of disclosures.

        This acknowledgement does not authorize disclosure for marketing or sale of my PHI, which would require separate written authorization.
        """,
        false);
}
