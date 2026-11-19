// Data awal (seed) untuk mock API di services/productApi.js — dipakai saat localStorage masih kosong.
// Min & max = toleransi terhadap standard (lihat services/productSpec.js).
import productImg from "../assets/product-img.png";

const caliper = (points) => ({ toolId: "MT-001", toolName: "Caliper", points });
const micrometer = (points) => ({ toolId: "MT-002", toolName: "Micrometer", points });
const pt = (name, standard, min, max) => ({ name, standard, min, max });

const seed = [
  {
    id: "2120B-K0J-N000-IN",
    name: "Case Comp, Mission",
    tools: [
      caliper([
        pt("Height joint face", 125, -0.05, 0.05),
        pt("Depth", 6.5, 0, 0.5),
        pt("Width boss", 32, -0.1, 0.1),
        pt("Hole pitch", 88.4, -0.05, 0.05),
        pt("Flange thickness", 4.2, -0.1, 0.1),
      ]),
    ],
  },
  {
    id: "11341-K1A-N000",
    name: "Cover L Side K1AL N900",
    tools: [
      caliper([pt("Outer diameter", 142, -0.1, 0.1), pt("Depth", 18.5, 0, 0.3)]),
      micrometer([pt("Bearing bore", 42, 0, 0.025)]),
    ],
  },
  {
    id: "50350-K2F-N010",
    name: "Bracket Comp, Engine Hanger",
    tools: [caliper([pt("Hole distance", 64, -0.1, 0.1), pt("Plate thickness", 3.2, -0.05, 0.05)])],
  },
];

export const PRODUCTS = seed.map((p, i) => ({
  ...p,
  imageUrl: productImg,
  imageName: "product-image.png",
  imageSize: 87388,
  createdAt: new Date(Date.UTC(2026, 9, 10 - i)).toISOString(),
}));
