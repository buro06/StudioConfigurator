# Studio Configurator

Studio Configurator is a web-based dynamic configuration software designed for broadcast professionals. It streamlines the management of on-air graphics, talent names, sports scores, and other broadcast elements through an intuitive interface.

![Studio Configurator Interface](https://postimg.cc/ZCsnn3ct)

## Features

- **Anchor Management**: Configure names for main anchors, weather, and sports
- **Sports Scores Entry**: Real-time entry and management of game scores
- **Resource Upload**: Upload logos, fonts, and other broadcast assets
- **Lower Third Configuration**: Set up and customize lower third graphics
- **Credit Management**: Organize technical staff credits
- **Ticker Configuration**: Create and manage scrolling news ticker content
- **Database-less Structure**: Lightweight JSON files used for data

## Installation

1. Clone the repository
   ```
   git clone https://github.com/buro06/StudioConfigurator.git
   cd StudioConfigurator
   ```

2. Install dependencies
   ```
   npm i
   ```

3. Update configuration
   ```
   # Edit config.json to match your settings
   nano config.json
   ```

4. Start the application
   ```
   node index.js
   ```

5. Access the application
   ```
   Open your browser and navigate to the http://localhost:3000
   ```

## Usage
Get API for text values
```javascript
/get?q=<texts.json key>
Example: /get?q=leftAnchor
```
Styled Outputs
```javascript
/output/credits.html //Credits
/output/sportsTicker.html //Sports Ticker
```
File Uploads
- Subscriber Image: Logo displays only on logged in sessions
- Network Bug: Displays on Sports Ticker on right
- Font: Render the Credits output in this Font
- Favicon: favicon.ico for Studio Configurator

## System Requirements

- Node.js 14.x or higher

## License

Created by Burrough Osborne - ISC

## Support

For issues, feature requests, or support:
- Open an issue on GitHub
- Contact: [support@osbo.net](mailto:support@osbo.net)