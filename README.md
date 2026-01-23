# Vector - PowerPoint Ribbon Add-in

A Think-cell inspired PowerPoint add-in for inserting professional charts with one click.

## Overview

Vector is a PowerPoint Add-in (PPAM) that adds a custom "Vector" tab to the ribbon, providing quick access to chart insertion tools. Built using the same PPAM approach that Think-cell uses for deep PowerPoint integration.

## Features

- **Custom Ribbon Tab**: Appears before the Home tab for easy access
- **One-Click Charts**: Insert bar, column, line, pie, area, scatter, and combo charts
- **Auto-Centered**: Charts are automatically centered on the slide
- **Sample Data**: Charts come pre-populated with editable sample data
- **Native Integration**: Uses PowerPoint's native chart API for full compatibility

## Project Structure

```
vector/
├── Vector.ppam                    # Final add-in file (after build)
├── Vector_template.pptm           # Template for VBA import
├── Vector_ribbon_only.ppam        # Ribbon-only version (no VBA)
├── src/
│   ├── customUI/
│   │   └── customUI14.xml        # Ribbon definition (Office 2010+)
│   ├── vba/
│   │   └── Module1.bas           # VBA chart insertion code
│   └── assets/
│       └── icons/                # Custom button icons (future)
├── Scripts/
│   ├── build-ppam.py            # Build script
│   └── install.sh               # macOS installer
└── README.md
```

## Quick Start

### 1. Build the Add-in

```bash
python Scripts/build-ppam.py
```

This creates:
- `Vector_template.pptm` - Template with ribbon (needs VBA import)
- `Vector_ribbon_only.ppam` - Ribbon-only version

### 2. Add VBA Code

1. Open `Vector_template.pptm` in PowerPoint
2. Press `Alt+F11` (Windows) or `Tools > Macro > Visual Basic Editor` (Mac)
3. In VBA Editor: `File > Import File` → select `src/vba/Module1.bas`
4. Close VBA Editor
5. `File > Save As` → choose "PowerPoint Add-in (.ppam)" → name it `Vector.ppam`

### 3. Install

```bash
./Scripts/install.sh
```

Or manually copy `Vector.ppam` to:
- **macOS**: `~/Library/Group Containers/UBF8T346G9.Office/User Content/Add-Ins/`
- **Windows**: `%APPDATA%\Microsoft\AddIns\`

### 4. Enable in PowerPoint

1. Open PowerPoint
2. `Tools > PowerPoint Add-Ins...`
3. Click `+` or `Browse...`
4. Select `Vector.ppam`
5. Click `OK`

The **Vector** tab should now appear in your ribbon!

## Available Charts

| Button | Chart Type | Description |
|--------|-----------|-------------|
| Bar | Clustered Bar | Horizontal bar chart |
| Column | Clustered Column | Vertical column chart |
| Line | Line | Line chart with markers |
| Pie | Pie | Standard pie chart |
| Area | Area | Filled area chart |
| Scatter | XY Scatter | Scatter plot |
| Combo | Column + Line | Dual-axis combo chart |

## Requirements

- **PowerPoint**: 2016 or later (Windows/Mac)
- **VBA**: Must be enabled (if Think-cell works, VBA is already enabled)

## How It Works

### PPAM Structure

A PPAM file is a ZIP archive with Office Open XML structure:

```
Vector.ppam (ZIP)
├── [Content_Types].xml           # MIME types
├── _rels/.rels                   # Package relationships
├── ppt/
│   ├── presentation.xml          # Empty presentation
│   ├── vbaProject.bin            # Compiled VBA code
│   └── _rels/presentation.xml.rels
└── customUI/
    └── customUI14.xml            # Ribbon definition
```

### Ribbon Definition

The ribbon XML (`customUI14.xml`) defines:
- Custom tab position (before Home)
- Button groups and icons
- Callback function names

### VBA Callbacks

When a button is clicked, PowerPoint calls the corresponding VBA function:
- `InsertBarChart(control As IRibbonControl)`
- Uses `Shapes.AddChart2()` to insert native charts
- Charts are fully editable with PowerPoint's chart tools

## Development

### Modifying the Ribbon

Edit `src/customUI/customUI14.xml`:

```xml
<button id="btnNewChart" label="My Chart" size="large"
        imageMso="ChartTypeColumnClustered"
        onAction="InsertMyChart"/>
```

Available `imageMso` values: [Office ImageMso Gallery](https://bert-toolkit.com/imagemso-list.html)

### Adding New Chart Types

1. Add button to `customUI14.xml`
2. Add callback sub to `Module1.bas`:

```vba
Sub InsertMyChart(control As IRibbonControl)
    InsertChart xlColumnStacked, "My Chart"
End Sub
```

### Rebuilding

After changes:
1. Run `python Scripts/build-ppam.py`
2. Re-import VBA into the template
3. Save as PPAM
4. Reinstall

## Troubleshooting

### Ribbon doesn't appear
- Ensure the add-in is listed in `Tools > PowerPoint Add-Ins`
- Check the box next to Vector to enable it
- Restart PowerPoint

### Buttons don't work
- VBA may not be imported - check VBA Editor for the module
- Enable macros in Trust Center settings

### "Cannot run the macro" error
- VBA is not enabled in PowerPoint
- Go to `Preferences > Security & Privacy > Enable VBA macros`

## License

MIT License

## Credits

Inspired by Think-cell's ribbon integration approach.
