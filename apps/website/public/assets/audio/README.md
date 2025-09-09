# Audio Directory

This directory will contain audio samples and tracks for the Lukeus Music Lab website.

## Audio Structure

### Project Audio

- **projects/**: Full tracks or longer compositions
- **experiments/**: Short audio experiments and tests
- **samples/**: Audio samples and loops

### Format Guidelines

- **Format**: Use modern web audio formats (MP3, OGG, WebM)
- **Quality**: Balance file size with audio quality
- **Naming**: Use descriptive, lowercase names with hyphens
- **Metadata**: Include proper ID3 tags for projects

## Example Structure

```
audio/
├── projects/
│   ├── midnight-frequencies-preview.mp3
│   ├── digital-raindrops-demo.mp3
│   └── lucid-loops-excerpt.mp3
├── experiments/
│   ├── reverse-piano-decay.mp3
│   ├── vocal-texture-study.mp3
│   ├── analog-drift-simulation.mp3
│   └── city-rhythms.mp3
└── samples/
    ├── ambient-textures/
    └── field-recordings/
```

## Technical Notes

- Keep preview files under 2MB for web delivery
- Consider using Web Audio API for interactive playback
- Implement progressive loading for better user experience
- Add audio visualizations using Canvas or WebGL

## Future Features

- Waveform visualization
- Interactive audio players
- Playlist functionality
- Audio analysis and metadata display
