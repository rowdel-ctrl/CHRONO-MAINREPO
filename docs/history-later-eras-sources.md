# Background history for the three later eras: sources and connections

Written 2026-11-11 (GAME chat). The story cards for the American, World War 2 and modern eras are in
`CHRONO-GAMEAPP/lib/data/era_story.dart` (cards) and `CHRONO-GAMEAPP/lib/core/constants.dart`
(`historicalText`, the same facts as one paragraph). Questions were NOT changed.

## How the cards connect to the questions

Each era's questions carry a `subTopic`. Each sub-topic has one story card, in the same order as the
levels (card N is shown before level N, see `level_splash.dart`, which uses `beats[level - 1]`).

| Era | Level | Question sub-topic | Card label |
|---|---|---|---|
| American | 1 | Ang Katipunan: pagkakatatag, layunin, aral at paglaganap | KATIPUNAN |
| American | 2 | Mga pangyayari sa Himagsikang Pilipino (1892-1896) | 1896 |
| American | 3 | Mga bunga ng Himagsikang Pilipino (1892-1896) | BUNGA |
| American | 4 | Deklarasyon ng Kasarinlan at ang Unang Republika | 1898 |
| American | 5 | Ang kababaihan sa Himagsikang Pilipino | KABABAIHAN |
| American | 6 | Ang konsepto ng imperyalismo | IMPERYALISMO |
| American | 7 | Ang Digmaang Pilipino-Amerikano | DIGMAAN |
| American | 8 | Mga imperyalistang pamamaraan ng mga Amerikano | PAMAMARAAN |
| WW2 | 1 | Tungo sa nagsasariling pamahalaan | KAPULUNGAN |
| WW2 | 2 | Pamahalaang Komonwelt at mga Pilipinong lumaban para sa kalayaan | KOMONWELT |
| WW2 | 3 | Layunin at mahahalagang pangyayari sa pananakop ng mga Hapones | 1941 |
| WW2 | 4 | Mga pagbabago sa lipunang Pilipino sa ilalim ng mga Hapones | PAMAHALAANG HAPON |
| WW2 | 5 | Pananaliksik sa pagpupunyagi ng mga Pilipino tungo sa kalayaan | GERILYA |
| WW2 | 6 | Kaayusang panlipunan pagkatapos ng Ikalawang Digmaang Pandaigdig | 1946 |
| WW2 | 7 | Neokolonyalismo: patakarang pang-ekonomiya at kasunduang militar | NEOKOLONYALISMO |
| WW2 | 8 | Epekto ng neokolonyalistang pananaw sa kultura at lipunan | KULTURA |
| Modern | 1 | Mga suliranin at hamon sa ilalim ng Batas Militar | 1972 |
| Modern | 2 | People Power I at ang muling pagkamit ng kalayaan | EDSA |
| Modern | 3 | Kaayusang panlipunan matapos ang EDSA 1 | KONSTITUSYON |
| Modern | 4 | Mga hamong politikal mula 1987 hanggang kasalukuyan | POLITIKA |
| Modern | 5 | Mga hamong pang-ekonomiya mula 1987 hanggang kasalukuyan | EKONOMIYA |

Labels 1941, 1946 and EDSA are kept because `lib/data/login_facts.dart` points at them.

## Sources

- **Verified on the web during this work** (results checked, see below):
  - Acta de Declaracion de Independencia, June 12, 1898, Kawit; read by Ambrosio Rianzares Bautista. Manila Bulletin, "Remembering June 12, 1898" (https://mb.com.ph/2026/06/12/remembering-june-12-1898) and Wikipedia, "Philippine Declaration of Independence" (https://en.wikipedia.org/wiki/Philippine_Declaration_of_Independence).
  - Tirad Pass, December 2, 1899, Gregorio del Pilar; Malvar surrender April 1902; war declared over July 4, 1902. Wikipedia, "Battle of Tirad Pass" (https://en.wikipedia.org/wiki/Battle_of_Tirad_Pass); Inquirer, "General Malvar did not surrender" (https://opinion.inquirer.net/99154/general-malvar-not-surrender). The sources disagree on the Malvar date (April 13 or 16), so the card says only April 1902.
  - Teresa Magbanua, "Visayan Joan of Arc". Wikipedia (https://en.wikipedia.org/wiki/Teresa_Magbanua).
  - Josefa Llanes Escoda, arrested August 27, 1944, last seen January 6, 1945; Chief Justice Jose Abad Santos, executed May 1942. Wikipedia (https://en.wikipedia.org/wiki/Josefa_Llanes_Escoda), (https://en.wikipedia.org/wiki/Jos%C3%A9_Abad_Santos).
  - Pact of Biak-na-Bato, December 14-15, 1897; Pedro Paterno as mediator; exile to Hong Kong. Wikipedia, "Pact of Biak-na-Bato" and "Republic of Biak-na-Bato".
  - Malolos Congress met September 15, 1898 at Barasoain; Republic inaugurated January 23, 1899, Aguinaldo first president. Wikipedia, "Malolos Congress" (https://en.wikipedia.org/wiki/Malolos_Congress).
  - Treaty of Paris, December 10, 1898, $20 million; Benevolent Assimilation, December 21, 1898. Inquirer (https://usa.inquirer.net/140586/december-1898-spanish-american-war-formally-over); Wikipedia, "Benevolent assimilation" (https://en.wikipedia.org/wiki/Benevolent_assimilation).
  - Tydings-McDuffie Act, 1934 (10-year transition); Commonwealth inaugurated November 15, 1935, Quezon and Osmena. Wikipedia, "Commonwealth of the Philippines" (https://en.wikipedia.org/wiki/Philippine_Commonwealth).
  - Second Philippine Republic, October 14, 1943, Laurel; KALIBAPI; Makapili; Kempeitai. Wikipedia, "Second Philippine Republic" (https://en.wikipedia.org/wiki/Second_Philippine_Republic), "KALIBAPI" (https://en.wikipedia.org/wiki/KALIBAPI).
  - Martial law: Proclamation 1081 signed September 21, 1972; formally lifted January 17, 1981 by Proclamation 2045, with Marcos keeping his power. Wikisource, "Proclamation No. 2045" (https://en.wikisource.org/wiki/Proclamation_No._2045_(Marcos)); Wikipedia, "Martial law under Ferdinand Marcos" (https://en.wikipedia.org/wiki/Martial_law_under_Ferdinand_Marcos).
  - EDSA, February 22-25, 1986: Enrile and Ramos break away, Cardinal Sin on Radio Veritas, bloodless end on February 25. Inquirer, "Timeline: Feb. 22, 1986, Day One" (https://newsinfo.inquirer.net/?p=579772); Rappler, "Cardinal Jaime Sin 1986 appeal" (https://www.rappler.com/nation/audio-jaime-cardinal-sin-1986-appeal-go-edsa-support-fidel-ramos-juan-ponce-enrile/).

- **From my own knowledge, NOT checked on the web.** Please check these against the NHCP (https://nhcp.gov.ph) or the Official Gazette (https://www.officialgazette.gov.ph) before the next build:
  - Katipunan founded in 1892 by Bonifacio; Jacinto wrote the Kartilya; Pugad Lawin cedula tearing in August 1896; San Juan del Monte attack August 30, 1896; Rizal executed December 30, 1896; Bonifacio executed May 1897.
  - Gregoria de Jesus as "Lakambini"; Marcela Agoncillo and the flag sewn in Hong Kong; Gold, Glory and God; Thomasites 1901; Batas Sedisyon 1901.
  - Jones Law 1916; Filipinization under Harrison; OsRox mission 1922; women voting and the Tagalog-based national language in 1937; Surian ng Wikang Pambansa.
  - Bataan Death March April 1942; MacArthur's "I shall return" (March 1942); Hukbalahap; Chief Justice's refusal; Roxas as first president of the Third Republic; Ramon Magsaysay "Kampeon ng Masa"; Bell Trade Act 1946 with parity rights; Military Bases Agreement 1947 (99-year lease); Senate rejection 1991, bases out 1992; Constantino's "The Miseducation of the Filipino"; Cultural Center of the Philippines 1966.
  - Ninoy Aquino killed August 21, 1983 at the airport; snap election February 7, 1986; NAMFREL; Aquino sworn in February 25, 1986; Freedom Constitution; 1987 Constitution ratified February 2, 1987; PCGG; EDSA II January 2001; Pork Barrel Scam 2013; PCA ruling July 12, 2016; Bangsamoro Organic Law 2018; Philippines 2000 (Ramos); BPO; 4Ps 2008; TRAIN Law 2018; Yolanda November 8, 2013; COVID-19 2020.

## Not used, and why

- "Dakilang Lumpo" (Mabini): searched, not confirmed. Question text still has it; the card does not repeat it.
- Exact date of the Battle of Balangiga (September 28, 1901 in the question) and the start of the Philippine-American War (February 4, 1899): not confirmed on the web. The cards say only "1901" and "1899".
- Malolos Constitution's promulgation date: sources disagree (January 20 to 22, 1899), so the card gives only the inauguration date (January 23, 1899).
- Tejeros date: sources give March 20 or March 22, 1897, so the card says "Marso 1897".

## Not audited

I did not check the answer keys of the questions. Where a search touched a question's topic, the sources above are the check. If a question's answer looks wrong, tell me the question and I'll note it; the questions are not changed without you.
