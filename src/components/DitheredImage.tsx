import React, { useRef, useEffect, useMemo, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { TextureLoader, Vector2, Mesh, ShaderMaterial } from "three";
import { gsap } from "gsap";

// Inline shaders
const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;

    // Calculate world position for mouse interaction
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform float uHover;
uniform float uGlobalHover;
uniform float uColorNum;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vWorldPosition;

// 8x8 Bayer Matrix for ordered dithering
const float bayerMatrix8x8[64] = float[64](
    0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0, 3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
    32.0/64.0, 16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0, 19.0/64.0, 47.0/64.0, 31.0/64.0,
    8.0/64.0, 56.0/64.0, 4.0/64.0, 52.0/64.0, 11.0/64.0, 59.0/64.0, 7.0/64.0, 55.0/64.0,
    40.0/64.0, 24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0, 27.0/64.0, 39.0/64.0, 23.0/64.0,
    2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0, 1.0/64.0, 49.0/64.0, 13.0/64.0, 61.0/64.0,
    34.0/64.0, 18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0, 17.0/64.0, 45.0/64.0, 29.0/64.0,
    10.0/64.0, 58.0/64.0, 6.0/64.0, 54.0/64.0, 9.0/64.0, 57.0/64.0, 5.0/64.0, 53.0/64.0,
    42.0/64.0, 26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0, 25.0/64.0, 37.0/64.0, 21.0/64.0
);

// Function to apply ordered dithering
vec3 orderedDither(vec2 uv, vec3 color) {
    float threshold = 0.0;

    int x = int(uv.x * uRes.x) % 8;
    int y = int(uv.y * uRes.y) % 8;
    threshold = bayerMatrix8x8[y * 8 + x] - 0.88;

    color.rgb += threshold;
    color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);

    return color;
}

// Calculate luminance for grayscale conversion
float getLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Create fluid distortion effect based on mouse position
vec2 getDistortedUV(vec2 uv, vec2 mousePos, float intensity) {
    vec2 delta = uv - mousePos;
    float distance = length(delta);

    // Create a smooth falloff for the mouse influence
    float influence = 1.0 - smoothstep(0.0, 0.4, distance);
    influence = pow(influence, 1.5);

    // Create ripple effects from mouse position
    float ripple1 = sin(distance * 15.0 - uTime * 5.0) * 0.03;
    float ripple2 = sin(distance * 8.0 - uTime * 2.0) * 0.02;
    float ripple = (ripple1 + ripple2);

    // Push pixels away from mouse position
    vec2 pushDirection = normalize(delta);
    float pushStrength = (1.0 - distance) * 0.08;
    vec2 pushAway = pushDirection * pushStrength * intensity;

    // Apply distortion
    vec2 distortion = (pushDirection * ripple + pushAway) * influence * intensity;

    return uv + distortion;
}

void main() {
    // Convert mouse position to UV coordinates
    vec2 mouseUV = uMouse / uRes;

    // Get distorted UV coordinates based on mouse interaction
    vec2 distortedUV = getDistortedUV(vUv, mouseUV, uHover);

    // Sample the original texture
    vec4 originalColor = texture2D(uTexture, distortedUV);

    // Calculate distance from mouse for halo effect
    float mouseDistance = length(vUv - mouseUV);
    float haloInfluence = 1.0 - smoothstep(0.0, 0.4, mouseDistance);
    haloInfluence = pow(haloInfluence, 1.2);

    // Calculate overall effect intensity - stronger around mouse
    float effectIntensity = uHover * (0.3 + 2.0 * haloInfluence);

    // Convert to grayscale for black and white dithering
    float luminance = getLuminance(originalColor.rgb);
    vec3 grayscaleColor = vec3(luminance);

    // Apply dithering to grayscale
    vec3 ditheredColor = orderedDither(vUv, grayscaleColor);

    // Global black and white effect for entire image
    vec3 globalDithered = orderedDither(vUv, grayscaleColor);

    // Blend between original and global B&W based on global hover
    vec3 globalBlended = mix(originalColor.rgb, globalDithered, uGlobalHover);

    // Local effect around cursor
    vec3 localEffect = mix(globalBlended, ditheredColor, effectIntensity);

    // Add glow effect around mouse
    float glow = haloInfluence * uHover * 0.4;
    vec3 finalColor = localEffect + vec3(glow);

    gl_FragColor = vec4(finalColor, originalColor.a);
}
`;

interface DitheredImageProps {
  src: string;
  width?: number;
  height?: number;
  colorQuantization?: number;
}

const DitheredImage: React.FC<DitheredImageProps> = ({
  src,
  width = 4.85,
  height = 4.85,
  colorQuantization = 4,
}) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const hoverRef = useRef(0);
  const globalHoverRef = useRef(0);
  const [isHovering, setIsHovering] = useState(false);

  // Get Three.js context for mouse coordinates
  const { mouse } = useThree();

  // Load texture
  const texture = useLoader(TextureLoader, src);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uRes: { value: new Vector2(512, 512) },
      uHover: { value: 0 },
      uGlobalHover: { value: 0 },
      uColorNum: { value: colorQuantization },
      uTexture: { value: texture },
    }),
    [texture, colorQuantization],
  );

  // Update uniforms on each frame
  useFrame((state) => {
    if (materialRef.current) {
      // Update time
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // Convert mouse position to UV coordinates (0-1 range)
      const mouseX = (mouse.x + 1) * 0.5;
      const mouseY = (mouse.y + 1) * 0.5;
      materialRef.current.uniforms.uMouse.value.set(mouseX * 512, mouseY * 512);

      // Update hover intensity from GSAP animation
      materialRef.current.uniforms.uHover.value = hoverRef.current;
      materialRef.current.uniforms.uGlobalHover.value = globalHoverRef.current;
    }
  });

  // Handle hover animations with GSAP
  useEffect(() => {
    if (isHovering) {
      gsap.to(hoverRef, {
        current: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      // Global effect builds up over time
      gsap.to(globalHoverRef, {
        current: 1,
        duration: 2.0,
        ease: "power2.inOut",
      });
    } else {
      gsap.to(hoverRef, {
        current: 0,
        duration: 0.3,
        ease: "power2.out",
      });
      // Global effect fades out faster
      gsap.to(globalHoverRef, {
        current: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  }, [isHovering]);

  // Handle mouse events
  const handlePointerEnter = () => {
    setIsHovering(true);
  };

  const handlePointerLeave = () => {
    setIsHovering(false);
  };

  return (
    <mesh
      ref={meshRef}
      scale={[width, height, 1]}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

export { DitheredImage };
