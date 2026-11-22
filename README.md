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

## Music sources

| Source | What you need | Works in |
|---|---|---|
| **Last.fm** | A free Last.fm account connected to Spotify (or Apple Music, Deezer…), plus a free API key | OBS and StreamElements |
| **Tuna** | The free Tuna plugin for OBS, with its web server on (port 1608) | OBS on the same PC |
| **Streamer.bot** | Streamer.bot's WebSocket server, and an action that sends `{"title": "...", "artist": "..."}` | OBS and StreamElements |
| **Manual text** | Nothing: type the title and artist yourself | Everywhere |

### Last.fm in 2 minutes
1. Create a free account on last.fm.
2. Settings › Applications › connect **Spotify** (scrobbling).
3. Get an API key at `https://www.last.fm/api/account/create` (any app name, no callback needed).
4. Put your username and the key in the widget settings.

### Streamer.bot
Turn on **Servers › WebSocket Server**, then in the action that runs when your song changes, add a C# sub-action:

```csharp
CPH.WebsocketBroadcastJson("{\"title\":\"" + title + "\",\"artist\":\"" + artist + "\"}");
```

## Install

### OBS only
1. Open `index.html` (the configurator) in your browser.
2. Pick a station and a music source, then click **Copy the OBS link**.
3. OBS › **+** › **Browser** › paste the link › **520 × 110**. A bigger size such as 1040 × 220 works too: the radio scales itself.

### StreamElements
1. Overlays › your overlay › **+** › Static / Custom › **Custom widget** › **Open editor**.
2. Paste `streamelements/se-html.txt`, `se-css.txt`, `se-js.txt` and `se-fields.txt` into the HTML, CSS, JS and FIELDS tabs.
3. Done › Save, then choose the station and the music source in the widget settings.

## Editing

The source lives in `widget/`. After a change, sync the StreamElements copies:

```bash
python3 build-streamelements.py
```
