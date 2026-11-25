The studies reviewed here address several parts of barangay and local-government service delivery: resident records, document requests, document verification, complaint reporting, public communication, and adoption of digital services. They are organized by theme so their similarities and limits can be compared. Their results apply to the systems and settings studied; they do not establish BEST's performance.

## 2.1 Barangay Services and Information Management

Taruc et al. (2023) evaluate a web-based barangay document-request system, making their work a close comparison for BEST's request workflow. Bautista et al. (2023) combine document requests, incident reports, and decision-support functions in one barangay system. Galverio et al. (2026) examine municipal service requests through kiosk and online channels. Together, these studies show ways digital intake can organize requests and widen access. BEST shares the request-intake goal, while its barangay setting and documented workflows remain distinct.

Resident records and certificate preparation are also represented. Melendres and Aranda (2024) evaluate web-based resident information management, while Dela Cruz et al. (2023) include residency-certificate issuance in a barangay information system. Imus et al. (2018) provide earlier Philippine context for digitizing barangay records and administration. These works support accurate, retrievable records and consistent certificate processing as foundations for BEST, but their evaluation results do not measure BEST's data quality or certificate accuracy.

Tosper et al. (2025) and Gasmido et al. (2025) describe separate barangay information-management systems for Barangay Yuson and Ayos Lomboy. Although they share a journal issue and an author, they are distinct studies. Bringula et al. (2022) foreground usability in a community web-system framework. Eñano et al. (2025) combine resident records, administrative services, community records, and analytics in a portal, while Del Pilar et al. (2024) apply geographic information to barangay governance. These projects show varied approaches; BEST shares the service and information-management concerns but does not include the analytics or mapping functions of those systems.

## 2.2 Document Authentication and Verification

Lorien and Wellem (2021) and Wellem et al. (2022) study QR-based document authentication using digital signatures, including ECDSA in the latter work. Naser et al. (2020) study a QR-based two-factor process for paper-document checks. These works support the need for a reliable way to verify certificates, including printed documents. BEST's QR tracking and verification is related, but does not use digital signatures, ECDSA, or two-factor authentication. A QR code alone does not provide the guarantees those methods describe.

## 2.3 Anonymous Reporting and Privacy

Online reporting research informs BEST's anonymous blotter workflow. Lowry et al. (2013) examine factors related to use of online whistleblowing systems. Muljono et al. (2025) design a web-service-based whistleblowing system for higher education, and Natkar et al. (2025) present an anonymous whistleblowing system. These different settings raise privacy, clarity, and trust as concerns for online reporting. They support evaluating those concerns in BEST's reporting channel, but their outcomes should not be transferred directly to a barangay blotter.

Mbimbi et al. (2025) and Patil et al. (2025) explore zero-knowledge proofs for anonymous reporting and complaints. Miao (2023) applies zero-knowledge proofs to privacy-preserving voting, so it offers an adjacent comparison rather than a complaint-reporting model. These sources show stronger cryptographic approaches, but BEST does not implement zero-knowledge proofs or a private blockchain. BEST encrypts selected report fields on the server, and authorized staff can decrypt them. Its blotter is anonymous or best-effort anonymous, not zero-knowledge.

## 2.4 Community Communication and Information Access

Community communication studies consider how residents receive local information and services. Duat and Namoco (2016) propose a mobile-phone communication network for local community welfare. Perwitasari et al. (2023) use an SMS gateway for village information, while Rivas (2026) describes automated mobile messaging in a barangay information system. Garcia et al. (2021) focus on mobile and web services for a barangay health center. These works show approaches to timely local information and digital access. BEST's broadcasts and public information pages address related needs, while SMS gateways, automated messaging, and health-center services are outside BEST's current scope.

## 2.5 E-Government Adoption and Implementation Readiness

The usefulness of a digital service also depends on whether people can access and adopt it. Jou et al. (2024) examine accessibility factors for the eGov PH mobile application. Valle et al. (2024) study e-government, citizen engagement, and service delivery in Caloocan local government units, while Volante (2026) analyzes implementation of local e-government initiatives in Malilipot. These Philippine studies bring accessibility, citizen engagement, and implementation conditions into the review. They support evaluating BEST with its intended residents and staff instead of assuming online access guarantees adoption.

International studies add context. Al Hujran et al. (2015) and Rabaa'i (2015) examine e-government adoption in Jordan, and Rokhman (2011) studies adoption in Indonesia. Their services, locations, and periods differ from BEST's setting, so their findings cannot predict whether Dumaguete City residents or barangay staff will use BEST. They do, however, establish adoption as a concern that BEST's own evaluation should address.

## 2.6 Synthesis and Research Gap

Across the reviewed sources, barangay and local-government systems address resident information, document issuance, request intake, staff workflows, communication, and public access (Bautista et al., 2023; Bringula et al., 2022; Imus et al., 2018; Taruc et al., 2023). Other studies focus on document authentication, privacy in online reporting, and community communication (Duat & Namoco, 2016; Lorien & Wellem, 2021; Lowry et al., 2013; Naser et al., 2020; Perwitasari et al., 2023; Wellem et al., 2022). Adoption and implementation studies add accessibility, usability, institutional readiness, and trust as concerns that accompany technical development (Jou et al., 2024; Valle et al., 2024; Volante, 2026).

The reviewed works differ in setting, audience, services, technology, and evaluation. The defensible research opportunity for BEST is therefore specific to its target environment: to implement and evaluate a barangay-focused system that brings resident document requests and status tracking, staff review, payment recording, public information, and anonymous blotter reporting into one local service platform. This is a project-specific gap inferred from the collected literature, not a claim that no system anywhere combines similar functions.

The literature also sets boundaries for what BEST can claim. Some reviewed document systems use digital signatures or two-factor checks, and some reporting studies use zero-knowledge proofs or blockchain. Those are not BEST features. BEST uses server-side encryption for selected fields and authorized staff can decrypt protected reports. Its certificate QR function should likewise be described only in terms of the verification process actually implemented.

The reviewed literature supports evaluating BEST through task completion and feedback from intended residents and staff. Relevant criteria include whether requests move through the documented workflow, whether residents and staff can understand request status, whether the interface is accessible, whether protected information is handled as intended, whether certificates are accurate, and whether the barangay has the operational readiness to use the system. Findings from the cited systems can inform these criteria, but they cannot substitute for results from BEST's own evaluation.

## References

Al Hujran, O., Aloudat, A., & Altarawneh, I. (2015). Factors influencing citizen adoption of e-government in developing countries: The case of Jordan. In *Public affairs and administration: Concepts, methodologies, tools, and applications* (Vol. 3, pp. 1349–1367). IGI Global. https://doi.org/10.4018/978-1-4666-8358-7.ch066

Bautista, M. T. T., Bolonos, A. K. B., Camba, U. J., De Guzman, L. M., Goh, M. L. I., Fernando, M. C. G., & Tolentino, L. S. (2023). BALANGAY: A web-based document request and incident reporting system with decision support for barangay program development. In *Lecture Notes in Networks and Systems* (Vol. 579, pp. 127–136). Springer. https://doi.org/10.1007/978-981-19-7663-6_13

Bringula, R. P., Vale, M. A. D., Napolis, J. A., Oliva, F. P., & De La Serna, D. J. T. (2022). E-Barangay: A framework for a web-based system for local communities and its usability. *International Journal of Electronic Government Research, 18*(1), 1–13. https://doi.org/10.4018/IJEGR.288071

Dela Cruz, L. A., Balilia, C. J., Abana, E., Pagulayan, L., Mebana, J.-E., Datul, D. J., & Acoba, J. A. (2023). Enhanced barangay information management system with residency certificate issuance. In *2023 IEEE 8th International Conference on Recent Advances and Innovations in Engineering (ICRAIE)* (pp. 1–6). IEEE. https://doi.org/10.1109/ICRAIE59459.2023.10468134

Del Pilar, C. G. E., Nale, S. G. R., Jinio, A. L., Abando, D. S., Blanco, M. C. R., & Sison, A. A. R. C. (2024). B-GIS: Modernizing local governance through a web-based barangay geographic information system for Barangay 99, Tondo, Manila. In *2024 International Conference on Innovation and Intelligence for Informatics, Computing, and Technologies (3ICT)* (pp. 161–166). IEEE. https://doi.org/10.1109/ICICYTA64807.2024.10912845

Duat, D. L., & Namoco, C. (2016). A communication network for local community welfare in the Philippines: An alternative approach using mobile phone technology. *Indian Journal of Science and Technology, 9*(45). https://doi.org/10.17485/ijst/2016/v9i45/102560

Eñano, J. V., Natividad, K. P., Pantoja, D. R., Ebi, F. C. D., Bautista, J. V., & Cura, D. (2025). BarangayConnect: A web-based information portal for resident data, administrative services, and community records using data analytics and linear regression algorithms. *International Journal of Research and Innovation in Social Science, 9*(10), 1485–1497. https://doi.org/10.47772/ijriss.2025.910000127

Galverio, L. P. A., Fernandez, M. A. L., Suarez, J. C., Lapeña, M. J., & Villanueva, L. G. V. (2026). Click2Serve: Kiosk and online platform for municipal service request in Alaminos City. *Asian Journal of Multidisciplinary Studies, 9*(1), 82–92. https://asianjournal.pti.edu.ph/index.php/ajms/article/view/609

Garcia, M. R. Q., Jimenez, K. L. D., Simacon, R. R. O., Vito, M. C. C., & Yabut, E. R. (2021). B-Health: A framework for mobile and web application for barangay health center in the municipality of Laguna. In *2021 4th International Conference on Computing and Information Technology (I2CIT)* (pp. 107–112). IEEE. https://doi.org/10.1109/iCORE54267.2021.00038

Gasmido, W., De Guzman, J., Natividad, C. J., Sicuan, C. K. B., & Reyes, D. (2025). Digital Barangay: Ayos Lomboy's web-based management and information system. *Psychology and Education: A Multidisciplinary Journal, 37*(5), 424–431. https://doi.org/10.70838/pemj.370501

Imus, J. K. P., Magleo, E. D., Soriano, M. A. A., & Olalia, R. L. (2018). Barangay management information system (BMIS) for cities and municipalities in the Philippines. *International Journal of Computer Applications, 180*(19), 33–36. https://doi.org/10.5120/ijca2018916441

Jou, Y.-T., Mariñas, K. A., Saflor, C. S., Baleña, A., Gutierrez, C. J., Dela Fuente, G., Manzano, H. M., Tanglao, M. S., Verde, N. A., Alvarado, P., & Young, M. N. (2024). Investigating various factors influencing the accessibility of digital government with eGov PH mobile application. *Sustainability, 16*(3), Article 992. https://doi.org/10.3390/su16030992

Lorien, A., & Wellem, T. (2021). Implementasi sistem otentikasi dokumen berbasis Quick Response (QR) code dan digital signature [Implementation of a document authentication system based on Quick Response (QR) code and digital signature]. *Jurnal RESTI (Rekayasa Sistem dan Teknologi Informasi), 5*(4), 663–671. https://doi.org/10.29207/resti.v5i4.3316

Lowry, P. B., Moody, G. D., Galletta, D. F., & Vance, A. (2013). The drivers in the use of online whistle-blowing reporting systems. *Journal of Management Information Systems, 30*(1), 153–190. https://doi.org/10.2753/MIS0742-1222300105

Mbimbi, B., Murray, D., & Wilson, M. (2025). Preserving whistleblower anonymity through zero-knowledge proofs and private blockchain: A secure digital evidence management framework. *Blockchains, 3*(2), Article 7. https://doi.org/10.3390/blockchains3020007

Melendres, U. M., & Aranda, K. M. (2024). Development and evaluation of a web-based resident information management system. *Journal of Computer, Software, and Program, 1*(1), 14–22. https://doi.org/10.69739/jcsp.v1i1.50

Miao, Y. (2023). Secure and privacy-preserving voting system using zero-knowledge proofs. *Applied and Computational Engineering, 8*, 328–333. https://doi.org/10.54254/2755-2721/8/20230181

Muljono, N. D., Sanjaya, R., & Chandrawati, T. B. (2025). Design of whistleblowing system in higher education environment based on web service. *Journal of Business and Technology, 5*(2), 54–61. https://doi.org/10.24167/jbt.v5i2.11478

Naser, M. A. U., Jasim, E. T., & Al-Mashhadi, H. M. (2020). QR code based two-factor authentication to verify paper-based documents. *TELKOMNIKA (Telecommunication Computing Electronics and Control), 18*(4), 1834–1842. https://doi.org/10.12928/telkomnika.v18i4.14339

Natkar, A., Muley, I., Kate, P., Bhor, Y., Lanjulkar, S., & Mali, A. (2025). Securing voices against corruption: A system for anonymous whistleblowing. *International Journal on Advanced Computer Engineering and Communication Technology, 14*(1), 584–588. https://doi.org/10.65521/ijacect.v14i1.595

Patil, M., Rane, S., Shah, A., Shekokar, N., Repe, A., & Bhole, D. (2025). Multi-ID zero knowledge proof systems for anonymous and verified complaints. In *2025 International Conference on Wireless, Telecommunication and IoT (ICWITE)* (pp. 1–6). IEEE. https://doi.org/10.1109/ICWITE64848.2025.11306926

Perwitasari, I. D., Hendrawan, J., & Putri, N. A. (2023). Sistem informasi warta desa (SIWADA) dengan menggunakan SMS gateway pada Desa Klambir Lima Kebun [Village news information system (SIWADA) using an SMS gateway in Klambir Lima Kebun Village]. *Jurnal Indonesia Manajemen Informatika dan Komunikasi, 4*(2), 529–539. https://doi.org/10.35870/jimik.v4i2.247

Rabaa'i, A. A. (2015). An empirical investigation on the adoption of e-government in developing countries: The case of Jordan. *Computer and Information Science, 8*(3), 83–99. https://doi.org/10.5539/cis.v8n3p83

Rivas, R. M. (2026). Barangay information management system with automated mobile messaging for improved community engagement. *International Journal on Science and Technology, 17*(1). https://doi.org/10.71097/IJSAT.v17.i1.10412

Rokhman, A. (2011). E-government adoption in developing countries: The case of Indonesia. *Journal of Emerging Trends in Computing and Information Sciences, 2*(5), 228–236. https://www.cisjournal.org/archive/vol2no5/vol2no5_8.pdf

Taruc, F. S., Martin, T. A. S., Olipas, C. N. P., & Alegado, R. T. (2023). Docu-Go: The development and assessment of a web-based barangay document requesting system. *International Journal of Information Technology and Computer Engineering, 3*(4), 40–49. https://doi.org/10.55529/ijitc.34.40.49

Tosper, R., Mangalino, J., Obena, K., Simón, M., Tayag, M., Villano, K. J., & Reyes, D. (2025). WebYu: A Barangay Yuson web-based information management system initiatives. *Psychology and Education: A Multidisciplinary Journal, 37*(5), 432–442. https://doi.org/10.70838/pemj.370502

Valle, J. S., Bugayao, Z. R., Gutierrez, C., Malang, B. P., & Malang, J. D. S. (2024). Impact of e-government technologies on citizen engagement and service delivery: A case study of local government units in Caloocan. *International Journal of Multidisciplinary: Applied Business and Education Research, 5*(11), 4577–4591. https://doi.org/10.11594/ijmaber.05.11.24

Volante, E. (2026). Transforming governance: Exploring the implementation of e-government initiatives in the Municipality of Malilipot, Albay. *Pantao (International Journal of the Humanities and Social Sciences), 5*(2), 1–12. https://doi.org/10.69651/PIJHSS0502877

Wellem, T., Nataliani, Y., & Iriani, A. (2022). Academic document authentication using elliptic curve digital signature algorithm and QR code. *JOIV: International Journal on Informatics Visualization, 6*(3), 667–675. https://doi.org/10.62527/joiv.6.3.872
