# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Shader Hover Effect

The goal is to create a shader dithering effect that reacts to motion over and image on hover.

You can view examples of the effect locally my searching the folder .claude for .jpg images.

## Project Overview

This is a Vite + React + TypeScript project that uses Bun as the runtime. The project aims to recreate a shader-based dithering hover effect similar to the one on stabondar.com.

**Key Technologies:**

- three.js (for WebGL/shaders)
- gsap (for animations)
- react-three-fiber (React bindings for Three.js)

## Development Commands

- `bun install` - Install project dependencies
- `bun add <package_name>` - Add new packages
- `bun dev` - Start development server (user will run manually) DO NOT EVER RUN THIS
- `bun run build` - Build for production (runs TypeScript compilation + Vite build)
- `bun run lint` - Run ESLint
- `bun run preview` - Preview production build

## Current State

The base React app structure exists with:

- Basic Vite + React + TypeScript setup
- Single image display (divers.webp) in App.tsx
- No Three.js or shader implementations yet

**Required packages to add:**

- @react-three/fiber
- three
- @types/three
- gsap

## Shader effect

The idea is to re-create the same effect on this website:
[stabondar](https://www.stabondar.com)

The developer wrote a blog post about it which you can reference here: [blog post](https://tympanus.net/codrops/2025/03/25/stas-bondar-25-the-code-techniques-behind-a-next-level-portfolio/)

He specifically talks about the shader hover effect, when he says "I used the dithering effect (thanks, Maxime, for the fabulous tutorial on it) across almost the entire website for images and videos." The article he refers to by Maxine is available here [Maxime's tutorial](https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/)
The Bayer effect we want to recreate is the ones in the project thumbnails hover effect. He provides this shader as an example:

```glsl
vec3 orderedDither(vec2 uv, vec3 color)
{
    float threshold = 0.0

    int x = int(uv.x * uRes.x) % 8
    int y = int(uv.y * uRes.y) % 8
    threshold = bayerMatrix8x8[y * 8 + x] - 0.88

    color.rgb += threshold
    color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0)
    color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0)
    color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0)

    return color
}

```

## Additional References

[How to Create Distortion and Grain Effects on Scroll with Shaders in Three.js](https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/)
