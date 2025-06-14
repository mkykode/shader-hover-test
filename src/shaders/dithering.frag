uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform float uHover;
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
    float influence = 1.0 - smoothstep(0.0, 0.3, distance);
    influence = pow(influence, 2.0);

    // Create ripple effect
    float ripple = sin(distance * 20.0 - uTime * 3.0) * 0.01;

    // Apply distortion
    vec2 distortion = normalize(delta) * ripple * influence * intensity;

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
    haloInfluence = pow(haloInfluence, 1.5);

    // Calculate overall effect intensity
    float effectIntensity = uHover * (0.3 + 0.7 * haloInfluence);

    // Convert to grayscale for black and white dithering
    float luminance = getLuminance(originalColor.rgb);
    vec3 grayscaleColor = vec3(luminance);

    // Apply dithering to grayscale
    vec3 ditheredColor = orderedDither(vUv, grayscaleColor);

    // Blend between original color and dithered black/white based on effect intensity
    vec3 finalColor = mix(originalColor.rgb, ditheredColor, effectIntensity);

    // Add subtle glow effect near mouse
    float glow = haloInfluence * uHover * 0.1;
    finalColor += vec3(glow);

    gl_FragColor = vec4(finalColor, originalColor.a);
}
