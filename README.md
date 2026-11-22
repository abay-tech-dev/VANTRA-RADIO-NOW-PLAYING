# VANTRA STUDIO — Radio Now Playing

Your stream music shown as a fictional FM radio station.
A 520 × 110 banner for OBS and StreamElements:

- **Left:** a retro car radio with a frequency dial (88–108), an orange needle and cyan LCD digits ("103.5 FM")
- **Center:** the station name in neon script (Yellowtail), then the title and artist, scrolling when they're too long
- **Right:** 12 animated equalizer bars (coral → hot pink)
- **Track change:** the needle sweeps the dial with 400 ms of radio static (picture + optional sound), then the new title appears

## Stations

| Style | Default name | Frequency |
|---|---|---|
| Synthwave (default) | Neon FM | 103.5 |
| Rock | Thunder Rock | 98.7 |
| Hip-hop | Block Party | 105.9 |
| Lo-fi | Chill Wave | 88.1 |

The name, the frequency and all the colors can be changed.

## Music source: Last.fm

The radio shows the track marked **"now playing"** on your Last.fm profile, checked every few seconds.
Anything that sends "now playing" to Last.fm works:

| You listen on | How it reaches Last.fm |
|---|---|
| **Spotify** (app, phone, web) | Last.fm › Settings › Applications › Spotify Scrobbling › Connect |
| **Apple Music** | Play on music.apple.com with the free **Web Scrobbler** browser extension connected to Last.fm |
| **Deezer, YouTube Music, SoundCloud…** in a browser | The **Web Scrobbler** extension |

No Last.fm? Use **Manual text**: type the title and artist yourself.

### Set up Last.fm (free, ~5 minutes)
1. Create an account on last.fm.
2. Connect your player (table above). Play a song: it should show "Scrobbling now" on your profile.
3. Get an API key at `https://www.last.fm/api/account/create` (any app name, leave the URLs empty). Copy the **API key** (32 characters), not the shared secret.
4. In the configurator, type your username and the key, then click **Test my Last.fm**.

| Message | What to do |
|---|---|
| Username not found | Check the spelling of your Last.fm username |
| Invalid API key | Copy the "API key" again, not the shared secret |
| History is private | Untick "Hide recent listening information" in Last.fm privacy settings |
| Nothing playing right now | Start a song; check Spotify isn't in a private session |

When nothing plays, the radio can show a message, the **last track played**, or hide itself.

## Install

### OBS only
1. Open `index.html` (the configurator) in your browser.
2. Pick a station, enter your Last.fm username and API key (or use Manual text), then click **Copy the OBS link**.
3. OBS › **+** › **Browser** › paste the link › **520 × 110**. A bigger size such as 1040 × 220 works too: the radio scales itself.

### StreamElements
1. Overlays › your overlay › **+** › Static / Custom › **Custom widget** › **Open editor**.
2. Paste `streamelements/se-html.txt`, `se-css.txt`, `se-js.txt` and `se-fields.txt` into the HTML, CSS, JS and FIELDS tabs.
3. Done › Save, then choose the station and enter your Last.fm username and API key in the widget settings.

## Editing

The source lives in `widget/`. After a change, sync the StreamElements copies:

```bash
python3 build-streamelements.py
```
