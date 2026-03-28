export default function LiquidGlassFilter() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        {/* Liquid glass filter for navbar */}
        <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
          {/* Blur the background */}
          <feGaussianBlur in="BackgroundImage" stdDeviation="24" result="blur" />

          {/* Create a subtle displacement for the liquid distortion */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="1"
            result="noise"
          />
          <feDisplacementMap
            in="blur"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />

          {/* Specular highlight for glass refraction look */}
          <feSpecularLighting
            in="noise"
            surfaceScale="3"
            specularConstant="0.6"
            specularExponent="30"
            lightingColor="white"
            result="specular"
          >
            <fePointLight x="100" y="-50" z="200" />
          </feSpecularLighting>
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="spec-clip" />

          {/* Merge: displaced blur + specular + original content */}
          <feMerge>
            <feMergeNode in="displaced" />
            <feMergeNode in="spec-clip" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Liquid glass filter for buttons */}
        <filter id="liquid-glass-btn" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="BackgroundImage" stdDeviation="16" result="blur" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="blur"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feSpecularLighting
            in="noise"
            surfaceScale="2"
            specularConstant="0.5"
            specularExponent="25"
            lightingColor="white"
            result="specular"
          >
            <fePointLight x="60" y="-30" z="150" />
          </feSpecularLighting>
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="spec-clip" />
          <feMerge>
            <feMergeNode in="displaced" />
            <feMergeNode in="spec-clip" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
