# ChronoQuest Level Reference — DepEd MATATAG Budget of Work

Every one of the 43 game levels mapped to the official DepEd MATATAG Araling
Panlipunan three-term Budget of Work for Grades 5-6. The competencies below
(*Kasanayang Pampagkatuto*) are transcribed **verbatim** from the source BOW,
not paraphrased — they are what each level is required to teach, and therefore
what its questions must assess.

> Extracted from `ChronoQuest_Level_Topics.docx` on 2026-09-30 and kept as
> markdown so it is diffable, greppable and reviewable in a pull request. The
> original .docx was removed; this file is the reference.

**Source:** `G5_BOW_AP_5_-_Three-Term_v2.pdf` and `G6_BOW_AP_6_-_Three-Term_V2.pdf`
(DepEd, updated June 29, 2026), as cited in `GAMEPLAY-V2.md` Appendix D.

## Why this file matters

`GAMEPLAY-V2.md` Section 16 calls the question bank the single largest piece of
work in the project: roughly **450-500 questions**, 10-12 per level. This table
is what makes that tractable. Each level maps to exactly one BOW entry, so the
job is not "write 450 questions about Philippine history" but "write 10-12
questions for this named competency", 43 times — and every question traces back
to an official source, which is what makes the alignment defensible.

Level counts per era are uneven **on purpose**: some BOW entries span several
weeks (`Linggo 1-2`, `Linggo 3-5`), so one level can cover more than one week.
The counts below match `EraData.levelWeeks` in `lib/core/constants.dart`
exactly — 43 for 43, verified 2026-09-30.

| Era id | Filipino title | English title | Grade / Term | Levels |
|---|---|---|---|---|
| `pre-colonial` | Sinaunang Pilipinas | Ancient/Pre-colonial Philippines | Grade 5, Term 1 | 10 |
| `spanish` | Pananakop ng Espanya | Spanish Colonization | Grade 5, Term 2 | 5 |
| `nationalism` | Pag-usbong ng Nasyonalismo | Rise of Filipino Nationalism | Grade 5, Term 3 | 7 |
| `american` | Himagsikan at Imperyalismong Amerikano | Philippine Revolution & American Imperialism | Grade 6, Term 1 | 8 |
| `ww2` | Pamahalaang Kolonyal at Pananakop ng Hapon | Colonial Government & Japanese Occupation | Grade 6, Term 2 | 8 |
| `modern` | Batas Militar at Muling Pagbangon ng Demokrasya | Martial Law & Restoration of Democracy | Grade 6, Term 3 | 5 |

---

## 1. Sinaunang Pilipinas

**Ancient/Pre-colonial Philippines** · Grade 5, Term 1 · era id `pre-colonial` · 10 levels

BOW unit: ("Pinagmulan ng Pilipinas at Sinaunang Kalinangang Bayan")

| Level | Kasanayang Pampagkatuto (verbatim) |
|---|---|
| 1 (Linggo 1) | Naipaliliwanag ang pag-aaral ng kasaysayan at mga batayan nito; Natatalakay ang mga pamamaraan at pananaw ng kasaysayan |
| 2 (Linggo 2) | Natutukoy ang pinagmulan ng Pilipinas batay sa agham, kaalamang bayan, at relihiyon |
| 3 (Linggo 3) | Nasusuri ang pinagmulan ng sinaunang tao sa Pilipinas batay sa agham at kaalamang bayan |
| 4 (Linggo 4) | Nasusuri ang kaugnayan ng lokasyon sa paghubog ng kasaysayan |
| 5 (Linggo 5) | Nasusuri ang mga sinaunang bayang Pilipino batay sa organisasyong panlipunan, pang-ekonomiya, at pampolitika |
| 6 (Linggo 6) | Napahahalagahan ang ginampanan ng kababaihan sa pagbuo ng kalinangan ng sinaunang Pilipino; Naipaliliwanag ang konsepto ng kalinangan at uri nito |
| 7 (Linggo 7) | Nasusuri ang mga paniniwala, relihiyon, at tradisyon ng sinaunang bayang Pilipino |
| 8 (Linggo 8) | Natatalakay ang iba't ibang uri ng sinaunang sining, pagpapalamuti at arkitektura ng mga Pilipino. |
| 9 (Linggo 9) | Natatalakay ang pagdating at paglaganap ng Islam; Nasusuri ang mga katuruan ng Islam at pamahalaang sultanato |
| 10 (Linggo 10) | Napahahalagahan ang ugnayan ng sinaunang bayang Pilipino sa ilang piling bansa sa Asya |

## 2. Pananakop ng Espanya

**Spanish Colonization** · Grade 5, Term 2 · era id `spanish` · 5 levels

BOW unit: ("Pagtugon ng Bayan sa Hamon ng Kolonyalismong Espanyol")

| Level | Kasanayang Pampagkatuto (verbatim) |
|---|---|
| 1 (Linggo 1-2) | Natutukoy ang kahulugan at mga dahilan ng kolonisasyon; Nasusuri ang mga paraan sa pagsasailalim sa lipunang Pilipino |
| 2 (Linggo 3-5) | Nasusuri ang mga patakarang kolonyal na ipinatupad ng Espanya sa bansa |
| 3 (Linggo 6-7) | Nasusuri ang mga paraan ng pag-aangkop at pagtugon ng mga Pilipino sa kolonyalismong Espanyol |
| 4 (Linggo 8) | Natatalakay ang katayuan ng kababaihan sa panahon ng kolonyalismong Espanyol |
| 5 (Linggo 9-10) | Nasusuri ang mga pagpupunyagi, kinahinatnan, at implikasyon ng pagtatanggol ng mga katutubong pangkat, kababaihan, at iba pang sektor na mapanatili ang kalayaan sa kolonyalismo |

## 3. Pag-usbong ng Nasyonalismo

**Rise of Filipino Nationalism** · Grade 5, Term 3 · era id `nationalism` · 7 levels

BOW unit: ("Pag-usbong ng Nasyonalismong Pilipino")

| Level | Kasanayang Pampagkatuto (verbatim) |
|---|---|
| 1 (Linggo 1) | Nasusuri ang konsepto ng nasyonalismo |
| 2 (Linggo 2-3) | Nasusuri ang pagbabagong dulot ng kaisipang liberal sa pag-usbong ng nasyonalismo |
| 3 (Linggo 4-5) | Nasusuri ang ambag ng panggitnang uri sa pag-usbing ng nasyonalismong Pilipino |
| 4 (Linggo 6) | Naipaliliwanag ang kilusan para sa sekularisasyon at Pilipinisasyon ng mga Parokya |
| 5 (Linggo 7) | Nasusuri ang mga idinulot ng Cavite Mutiny at paggarote sa GOMBURZA sa pag-usbong ng nasyonalismong Pilipino |
| 6 (Linggo 8-9) | Naiisa-isa ang mga layunin ng pagkakatatag ng Kilusang Propaganda |
| 7 (Linggo 10) | Nasusuri ang papel na ginampanan ng Kilusang Propaganda sa pag-usbong ng nasyonalismo |

## 4. Himagsikan at Imperyalismong Amerikano

**Philippine Revolution & American Imperialism** · Grade 6, Term 1 · era id `american` · 8 levels

BOW unit: ("Himagsikang Pilipino at Simula ng Imperyalismong Amerikano")

| Level | Kasanayang Pampagkatuto (verbatim) |
|---|---|
| 1 (Linggo 1) | Natatalakay ang pagkakatatag, layunin, aral, at paglaganap ng Katipunan |
| 2 (Linggo 2) | Nasusuri ang mga pangyayaring naganap sa panahon ng Himagsikang Pilipino (1892-1896) |
| 3 (Linggo 3) | Nasusuri ang mga bunga ng pangyayari sa panahon ng Himagsikang Pilipino (1892-1896) |
| 4 (Linggo 4) | Napahahalagahan ang deklarasyon ng kasarinlan ng Pilipinas at ang pagkakatatag ng Unang Republika |
| 5 (Linggo 5) | Natatalakay ang partisipasyon ng kababaihan sa Himagsikang Pilipino |
| 6 (Linggo 6) | Natatalakay ang konsepto ng imperyalismo |
| 7 (Linggo 7-8) | Nasusuri ang pakikibaka ng mga Pilipino sa panahon ng Digmaang Pilipino-Amerikano |
| 8 (Linggo 9-10) | Nasusuri ang imperyalistang pamamaraang ginamit ng mga Amerikano sa pananakop sa Pilipinas |

## 5. Pamahalaang Kolonyal at Pananakop ng Hapon

**Colonial Government & Japanese Occupation** · Grade 6, Term 2 · era id `ww2` · 8 levels

BOW unit: ("Pamahalaang Kolonyal, Pananakop ng Hapones, at mga Hamon ng Neokolonyalismo")

| Level | Kasanayang Pampagkatuto (verbatim) |
|---|---|
| 1 (Linggo 1-2) | Nakabubuo ng kongklusyon tungkol sa pagsusumikap ng mga Pilipino tungo sa pagtatatag ng nagsasariling pamahalaan |
| 2 (Linggo 3) | Nasusuri ang polisiya at programa ng Pamahalaang Komonwelt; Natataya ang mga kontribusyon ng mga natatanging Pilipinong nakipaglaban para sa kalayaan laban sa mga Amerikano |
| 3 (Linggo 4) | Natatalakay ang mga layunin at mahahalagang pangyayari sa pananakop ng mga Hapones |
| 4 (Linggo 5) | Nasusuri ang mga pagbabagong naidulot sa lipunang Pilipino ng mga polisiya at programang ipinatupad ng mga Hapones |
| 5 (Linggo 6) | Nakapagsasagawa ng pananaliksik ukol sa kontribusyon ng pagpupunyagi ng mga Pilipino sa pagkamit ng ganap ng kalayaan |
| 6 (Linggo 7) | Nailalarawan ang kaayusang panlipunan sa Pilipinas matatapos ang Ikalawang Digmaang Pandaigdig |
| 7 (Linggo 8-9) | Natatalakay ang mga patakarang pang-ekonomiya ng Pilipinas mula 1946-1986 na nakatali sa neokolonyalismo; Nasisiyasat ang layunin ng mga kasunduang militar sa pagitan ng Pilipinas at Amerika |
| 8 (Linggo 10) | Nakabubuo ng kongklusyon tungkol sa epekto ng neokolonyalistang pananaw sa kultura at lipunang Pilipino |

## 6. Batas Militar at Muling Pagbangon ng Demokrasya

**Martial Law & Restoration of Democracy** · Grade 6, Term 3 · era id `modern` · 5 levels

BOW unit: ("Diktadura, Demokrasya, at ang Ikalimang Republika")

| Level | Kasanayang Pampagkatuto (verbatim) |
|---|---|
| 1 (Linggo 1-3) | Nasusuri ang mga suliranin at hamon sa kasarinlan at pagkabansa ng mga Pilipino sa ilalim ng Batas Militar |
| 2 (Linggo 4) | Nabibigyang-halaga ang kontribusyon ng People Power I sa muling pagkamit ng kalayaan at kasarinlan sa mapayapang paraan |
| 3 (Linggo 5-6) | Nailalarawan ang kaayusang panlipunan matapos ang EDSA 1 |
| 4 (Linggo 7-8) | Nakabubuo ng kongklusyon ukol sa mga hamong politikal ng Pilipinas mula 1987 hanggang sa kasalukuyan |
| 5 (Linggo 9-10) | Nasusuri ang mga hamong pang-ekonomiya ng Pilipinas mula 1987 hanggang sa kasalukuyan |
