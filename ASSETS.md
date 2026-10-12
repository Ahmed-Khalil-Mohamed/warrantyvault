# Application branding

The application icon derives from the existing MIT-licensed Phosphor icon set. SVG, PNG and seven-size ICO files are in `public`. The Windows packager embeds the ICO into the executable.

`public/splash.html` is a local, script-free startup banner displayed by a frameless Electron window. It closes after the workspace loads (minimum 900 ms display); smoke tests hide both windows and capture the banner for verification. No remote assets or network services are used.
