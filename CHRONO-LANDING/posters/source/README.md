# QR posters

`ChronoQuest-QR-Poster-Night-<version>.pdf` and `ChronoQuest-QR-Poster-Day-<version>.pdf` in the folder above are the A4 posters. Night is the dark game look, Day prints with less ink. Each has two QR codes: the landing page, and the direct APK download (`/downloads/chronoquest.apk`).

## Make them again

1. Install the one tool that is not in the project (it is not saved to `package.json`): `npm i --no-save playwright-core`
2. Open `build.cjs` and set `VERSION` and `SIZE` at the top. Change `SITE` only if the page moves to a new address.
3. From the `CHRONO-LANDING` folder run `node posters/source/build.cjs`. Google Chrome must be installed (set `CHROME_PATH` if it is not in the usual place), and the computer needs internet for the Poppins font.

`frag.html` holds the poster's text and styling. Edit it for any wording change, then run step 3.

## Notes

- The pictures come from `public/art/`, so the poster always uses the game's own sprites.
- Keep see-through gradients and hard-stop gradients out of the poster. They printed pink in some PDF viewers, so the colours are solid fills (the one soft glow at the top is an opaque gradient).
- After a change, scan both codes from the PDF with a phone before printing. The APK code always opens whichever file is on the live page.
