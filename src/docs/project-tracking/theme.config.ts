export interface HeroSlide {
  image: string
  headline: string
  subtext: string
  cta: string
}

export interface NicheTheme {
  name: string
  brand: string
  tagline: string
  description: string
  logo: string
  hero: {
    slides: HeroSlide[]
  }
  categories: { name: string; slug: string; image: string }[]
  about: {
    story: string
    mission: string
    image: string
  }
  contact: {
    address: string
    phone: string
    email: string
  }
  social: {
    twitter?: string
    instagram?: string
    facebook?: string
  }
  footer: {
    description: string
  }
}

export const themes: Record<string, NicheTheme> = {
  clothing: {
    name: "Attor",
    brand: "Attor",
    tagline: "Define Your Style",
    description: "Premium clothing for the modern individual.",
    logo: "/demo/clothing/logo.svg",
    hero: {
      slides: [
        {
          image: "/demo/clothing/hero-1.webp",
          headline: "Elevate Your Everyday Style",
          subtext: "Discover curated collections designed for those who refuse to blend in. From timeless classics to bold statements - wear what moves you.",
          cta: "Shop Collection",
        },
        {
          image: "/demo/clothing/hero-2.webp",
          headline: "Crafted for the Modern Man",
          subtext: "Sharp tailoring meets everyday comfort. Explore our men's collection built for the boardroom, the weekend, and everything in between.",
          cta: "Shop Men",
        },
        {
          image: "/demo/clothing/hero-3.webp",
          headline: "Effortless Style, Redefined",
          subtext: "From power dressing to casual elegance - our women's line is designed to move with you, not against you.",
          cta: "Shop Women",
        },
      ],
    },
    categories: [
      { name: "Men", slug: "men", image: "/demo/clothing/category-1.webp" },
      { name: "Women", slug: "women", image: "/demo/clothing/category-2.jpeg" },
      { name: "Accessories", slug: "accessories", image: "/demo/clothing/category-3.jpeg" },
    ],
    about: {
      story:
        "Attor was born from a simple belief: what you wear speaks before you do. Founded in 2020, we set out to create clothing that bridges the gap between timeless craftsmanship and modern sensibility. Every piece is designed with intention - clean lines, premium fabrics, and a fit that feels like it was made for you.",
      mission:
        "We believe style shouldn't come at the expense of comfort, quality shouldn't be a luxury, and great design should be accessible. Our mission is to outfit the world with confidence - one thoughtfully crafted piece at a time.",
      image: "/demo/clothing/about.jpg",
    },
    contact: {
      address: "123 Fashion Avenue, New York, NY 10001",
      phone: "+1 (555) 123-4567",
      email: "hello@attor.com",
    },
    social: {
      twitter: "https://twitter.com/attor",
      instagram: "https://instagram.com/attor",
      facebook: "https://facebook.com/attor",
    },
    footer: {
      description: "Premium clothing crafted for the modern individual. Quality fabrics, timeless designs, and a fit that feels like home.",
    },
  },
  perfume_oil: {
    name: "Attor",
    brand: "Attor",
    tagline: "Essence of Distinction",
    description: "Premium perfume oils crafted for the discerning.",
    logo: "/demo/perfume-oil/logo.png",
    hero: {
      slides: [
        {
          image: "/demo/perfume-oil/banner/hero-1.webp",
          headline: "Discover Your Signature Scent",
          subtext: "Explore our curated collection of artisanal perfume oils - from deep, smoky ouds to luminous florals. Find the fragrance that speaks to you.",
          cta: "Explore Collection",
        },
        {
          image: "/demo/perfume-oil/banner/hero-2.webp",
          headline: "The Art of Oud",
          subtext: "Journey through our collection of rare and precious oud oils - aged, layered, and utterly unforgettable.",
          cta: "Shop Oud Collection",
        },
        {
          image: "/demo/perfume-oil/banner/hero-3.webp",
          headline: "Bloom in Every Drop",
          subtext: "From Damask rose to jasmine sambac - our floral attars capture nature's most exquisite moments in every bottle.",
          cta: "Shop Florals",
        },
      ],
    },
    categories: [
      { name: "Oud", slug: "oud", image: "/demo/perfume-oil/categories/category-1.webp" },
      { name: "Floral", slug: "floral", image: "/demo/perfume-oil/categories/category-2.jpeg" },
      { name: "Citrus", slug: "citrus", image: "/demo/perfume-oil/categories/category-3.jpeg" },
    ],
    about: {
      story:
        "Attor began with a passion for the ancient art of perfumery. Rooted in tradition yet crafted for the modern connoisseur, each of our perfume oils is a journey - from the misty forests of Assam to the sun-drenched gardens of Grasse. We work directly with distillers and growers to bring you the purest expressions of nature's most precious botanicals.",
      mission:
        "We believe fragrance is the most intimate form of expression. Our mission is to make artisanal perfume oils accessible - offering uncompromising quality, ethical sourcing, and a sensory experience that transcends the ordinary.",
      image: "/demo/perfume-oil/about.jpeg",
    },
    contact: {
      address: "123 Perfume Avenue, New York, NY 10001",
      phone: "+1 (555) 123-4567",
      email: "hello@attor.com",
    },
    social: {
      twitter: "https://twitter.com/attor",
      instagram: "https://instagram.com/attor",
      facebook: "https://facebook.com/attor",
    },
    footer: {
      description: "Artisanal perfume oils crafted for those who seek the extraordinary. Pure ingredients, timeless scents, and a story in every drop.",
    },
  },
  eyewear: {
    name: "Attor Optics",
    brand: "ATTOR OPTICS",
    tagline: "See Clearly, Look Sharp",
    description: "Premium eyewear for the discerning eye.",
    logo: "/demo/eyewear/logo.svg",
    hero: {
      slides: [
        {
          image: "/demo/eyewear/hero.jpg",
          headline: "Frame Your World in Style",
          subtext: "Handcrafted eyewear that blends precision optics with bold design. Find your perfect frame - from classic sophistication to modern edge.",
          cta: "Browse Frames",
        },
        {
          image: "/demo/eyewear/cat-sunglasses.jpg",
          headline: "Sun's Out, Style On",
          subtext: "Block the glare, turn up the look. Our sunglasses collection pairs UV protection with undeniable attitude.",
          cta: "Shop Sunglasses",
        },
        {
          image: "/demo/eyewear/cat-optical.jpg",
          headline: "See the Difference",
          subtext: "Everyday optical frames engineered for comfort and clarity. Because your vision deserves the best fit.",
          cta: "Shop Optical",
        },
      ],
    },
    categories: [
      { name: "Sunglasses", slug: "sunglasses", image: "/demo/eyewear/cat-sunglasses.jpg" },
      { name: "Optical", slug: "optical", image: "/demo/eyewear/cat-optical.jpg" },
      { name: "Kids", slug: "kids", image: "/demo/eyewear/cat-kids.jpg" },
    ],
    about: {
      story:
        "Attor Optics began with a clear vision: create eyewear that's as functional as it is beautiful. Since 2021, we've partnered with master craftsmen to produce frames that balance precision optics with distinctive design - because how you see the world should be as sharp as how the world sees you.",
      mission:
        "Great vision deserves great frames. We're on a mission to make premium eyewear accessible - combining expert craftsmanship, premium materials, and bold design at prices that don't break the bank.",
      image: "/demo/eyewear/about.jpg",
    },
    contact: {
      address: "456 Vision Drive, San Francisco, CA 94102",
      phone: "+1 (555) 987-6543",
      email: "hello@attoroptics.com",
    },
    social: {
      twitter: "https://twitter.com/attoroptics",
      instagram: "https://instagram.com/attoroptics",
      facebook: "https://facebook.com/attoroptics",
    },
    footer: {
      description: "Premium eyewear crafted for the discerning eye. Precision optics, bold frames, and vision that stands out.",
    },
  },
}

export const DEFAULT_NICHE = "perfume_oil"
