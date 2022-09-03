export const abilities = [
  { name: "ISM", type: "STACKABLE" },
  { name: "ISS", type: "STACKABLE" },
  { name: "IRU", type: "STACKABLE" },
  { name: "RSU", type: "STACKABLE" },
  { name: "SSU", type: "STACKABLE" },
  { name: "SCU", type: "STACKABLE" },
  { name: "SS", type: "STACKABLE" },
  { name: "SPU", type: "STACKABLE" },
  { name: "QR", type: "STACKABLE" },
  { name: "QSJ", type: "STACKABLE" },
  { name: "BRU", type: "STACKABLE" },
  { name: "RES", type: "STACKABLE" },
  { name: "SRU", type: "STACKABLE" },
  { name: "IA", type: "STACKABLE" },
  { name: "OG", type: "HEAD_MAIN_ONLY" },
  { name: "LDE", type: "HEAD_MAIN_ONLY" },
  { name: "T", type: "HEAD_MAIN_ONLY" },
  { name: "CB", type: "HEAD_MAIN_ONLY" },
  { name: "NS", type: "CLOTHES_MAIN_ONLY" },
  { name: "H", type: "CLOTHES_MAIN_ONLY" },
  { name: "TI", type: "CLOTHES_MAIN_ONLY" },
  { name: "RP", type: "CLOTHES_MAIN_ONLY" },
  { name: "AD", type: "CLOTHES_MAIN_ONLY" },
  { name: "SJ", type: "SHOES_MAIN_ONLY" },
  { name: "OS", type: "SHOES_MAIN_ONLY" },
  { name: "DR", type: "SHOES_MAIN_ONLY" },
] as const;

export const abilitiesShort = abilities.map((ability) => ability.name);
