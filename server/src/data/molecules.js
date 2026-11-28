export const FAMILIES = {
  alcohol: { phrase: 'an alcohol', has: 'an –OH group on a saturated carbon' },
  aldehyde: { phrase: 'an aldehyde', has: 'a –CHO group at the end of the carbon chain' },
  ketone: { phrase: 'a ketone', has: 'a C=O group between two carbon atoms' },
  'carboxylic acid': { phrase: 'a carboxylic acid', has: 'a –COOH group' },
  ester: { phrase: 'an ester', has: 'a –COO– linkage between two carbon groups' },
  ether: { phrase: 'an ether', has: 'an –O– linkage between two carbon groups' },
  amine: { phrase: 'an amine', has: 'an –NH₂ group on a carbon' },
  amide: { phrase: 'an amide', has: 'a –CONH₂ group' },
  alkene: { phrase: 'an alkene', has: 'a C=C double bond' },
  alkyne: { phrase: 'an alkyne', has: 'a C≡C triple bond' },
  alkane: { phrase: 'an alkane', has: 'only single bonds between carbon atoms' },
  'aromatic hydrocarbon': { phrase: 'an aromatic hydrocarbon', has: 'a benzene ring' },
  haloalkane: { phrase: 'a haloalkane', has: 'a halogen atom bonded to a saturated carbon' },
  phenol: { phrase: 'a phenol', has: 'an –OH group attached to a benzene ring' },
}

// Families a student could reasonably confuse, so they never appear together as right and wrong answers
export const CONFUSABLE = {
  alcohol: ['phenol'],
  phenol: ['alcohol', 'aromatic hydrocarbon'],
  'aromatic hydrocarbon': ['phenol'],
}

export const GEOMETRIES = [
  'linear',
  'bent',
  'trigonal planar',
  'trigonal pyramidal',
  'tetrahedral',
  'trigonal bipyramidal',
  'octahedral',
  'square planar',
]

// Each formula is written in condensed form, so it points to exactly one compound in this list.
export const MOLECULES = [
  // Small molecules with a known shape
  { name: 'Water', formula: 'H₂O', geometry: 'bent', shapeWhy: 'Oxygen has two bonding pairs and two lone pairs, giving a bent shape (about 104.5°).', polar: true, polarWhy: 'Its bent shape means the two O–H bond dipoles do not cancel.' },
  { name: 'Carbon dioxide', formula: 'CO₂', geometry: 'linear', shapeWhy: 'Carbon has two double bonds and no lone pairs, so the molecule is linear (180°).', polar: false, polarWhy: 'The two C=O dipoles point in opposite directions in a linear molecule, so they cancel.' },
  { name: 'Ammonia', formula: 'NH₃', geometry: 'trigonal pyramidal', shapeWhy: 'Nitrogen has three bonding pairs and one lone pair, giving a trigonal pyramidal shape.', polar: true, polarWhy: 'Its pyramidal shape means the N–H dipoles do not cancel.' },
  { name: 'Methane', formula: 'CH₄', geometry: 'tetrahedral', shapeWhy: 'Carbon has four bonding pairs and no lone pairs, giving a tetrahedral shape (109.5°).', polar: false, polarWhy: 'The four identical C–H dipoles cancel in a tetrahedral shape.' },
  { name: 'Boron trifluoride', formula: 'BF₃', geometry: 'trigonal planar', shapeWhy: 'Boron has three bonding pairs and no lone pairs, giving a trigonal planar shape (120°).', polar: false, polarWhy: 'The three B–F dipoles cancel in a trigonal planar shape.' },
  { name: 'Sulfur hexafluoride', formula: 'SF₆', geometry: 'octahedral', shapeWhy: 'Sulfur has six bonding pairs and no lone pairs, giving an octahedral shape (90°).', polar: false, polarWhy: 'The six S–F dipoles cancel in an octahedral shape.' },
  { name: 'Phosphorus pentachloride', formula: 'PCl₅', geometry: 'trigonal bipyramidal', shapeWhy: 'Phosphorus has five bonding pairs and no lone pairs, giving a trigonal bipyramidal shape.', polar: false, polarWhy: 'The P–Cl dipoles cancel in a trigonal bipyramidal shape.' },
  { name: 'Xenon tetrafluoride', formula: 'XeF₄', geometry: 'square planar', shapeWhy: 'Xenon has four bonding pairs and two lone pairs, giving a square planar shape.', polar: false, polarWhy: 'The four Xe–F dipoles cancel in a square planar shape.' },
  { name: 'Sulfur dioxide', formula: 'SO₂', geometry: 'bent', shapeWhy: 'Sulfur has two bonding regions and one lone pair, giving a bent shape (about 119°).', polar: true, polarWhy: 'Its bent shape means the S=O dipoles do not cancel.' },
  { name: 'Hydrogen sulfide', formula: 'H₂S', geometry: 'bent', shapeWhy: 'Sulfur has two bonding pairs and two lone pairs, giving a bent shape (about 92°).', polar: true, polarWhy: 'Its bent shape means the two H–S dipoles do not cancel.' },
  { name: 'Sulfur trioxide', formula: 'SO₃', geometry: 'trigonal planar', shapeWhy: 'Sulfur has three bonding regions and no lone pairs, giving a trigonal planar shape.', polar: false, polarWhy: 'The three S=O dipoles cancel in a trigonal planar shape.' },
  { name: 'Carbon tetrachloride', aka: 'tetrachloromethane', formula: 'CCl₄', group: 'haloalkane', geometry: 'tetrahedral', shapeWhy: 'Carbon has four bonding pairs and no lone pairs, giving a tetrahedral shape.', polar: false, polarWhy: 'The four C–Cl dipoles cancel in a tetrahedral shape.' },
  { name: 'Hydrogen chloride', formula: 'HCl', polar: true, polarWhy: 'It has a single polar bond, so the molecule has a dipole.' },

  // Organic compounds (one clear functional group each)
  { name: 'Methanol', formula: 'CH₃OH', group: 'alcohol' },
  { name: 'Ethanol', formula: 'CH₃CH₂OH', group: 'alcohol' },
  { name: 'Propan-1-ol', formula: 'CH₃CH₂CH₂OH', group: 'alcohol' },
  { name: 'Methanal', aka: 'formaldehyde', formula: 'HCHO', group: 'aldehyde' },
  { name: 'Ethanal', aka: 'acetaldehyde', formula: 'CH₃CHO', group: 'aldehyde' },
  { name: 'Propanal', formula: 'CH₃CH₂CHO', group: 'aldehyde' },
  { name: 'Propanone', aka: 'acetone', formula: 'CH₃COCH₃', group: 'ketone' },
  { name: 'Methanoic acid', aka: 'formic acid', formula: 'HCOOH', group: 'carboxylic acid' },
  { name: 'Ethanoic acid', aka: 'acetic acid', formula: 'CH₃COOH', group: 'carboxylic acid' },
  { name: 'Propanoic acid', formula: 'CH₃CH₂COOH', group: 'carboxylic acid' },
  { name: 'Ethyl ethanoate', aka: 'ethyl acetate', formula: 'CH₃COOCH₂CH₃', group: 'ester' },
  { name: 'Ethoxyethane', aka: 'diethyl ether', formula: 'CH₃CH₂OCH₂CH₃', group: 'ether' },
  { name: 'Methylamine', formula: 'CH₃NH₂', group: 'amine' },
  { name: 'Ethanamide', aka: 'acetamide', formula: 'CH₃CONH₂', group: 'amide' },
  { name: 'Ethene', aka: 'ethylene', formula: 'CH₂=CH₂', group: 'alkene' },
  { name: 'Propene', aka: 'propylene', formula: 'CH₃CH=CH₂', group: 'alkene' },
  { name: 'Ethyne', aka: 'acetylene', formula: 'CH≡CH', group: 'alkyne' },
  { name: 'Ethane', formula: 'CH₃CH₃', group: 'alkane' },
  { name: 'Propane', formula: 'CH₃CH₂CH₃', group: 'alkane' },
  { name: 'Benzene', formula: 'C₆H₆', group: 'aromatic hydrocarbon' },
  { name: 'Phenol', formula: 'C₆H₅OH', group: 'phenol' },
  { name: 'Trichloromethane', aka: 'chloroform', formula: 'CHCl₃', group: 'haloalkane', polar: true, polarWhy: 'The three C–Cl bonds and one C–H bond do not cancel, so the molecule is polar.' },
  { name: 'Chloroethane', formula: 'CH₃CH₂Cl', group: 'haloalkane' },
]