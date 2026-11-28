// Four hand-written clues, from vague to specific. The fifth clue (the formula) is added automatically.
const compound = (name, aka, formula, clues) => ({
  name,
  aka,
  formula,
  clues: [...clues, `My formula is ${formula}.`],
})

export const MYSTERY = [
  compound('Water', null, 'H₂O', [
    'My liquid form covers most of Earth’s surface.',
    'My molecules are bent, with a bond angle of about 104.5°.',
    'Hydrogen bonding gives me a surprisingly high boiling point for such a small molecule.',
    'I boil at 100 °C at normal atmospheric pressure.',
  ]),
  compound('Ethanol', null, 'CH₃CH₂OH', [
    'Yeast can make me by fermenting sugars.',
    'I am a common solvent, and I can be blended into fuel.',
    'My molecules have an –OH group on a two-carbon chain.',
    'I boil at about 78 °C.',
  ]),
  compound('Ammonia', null, 'NH₃', [
    'I am a gas with a sharp, pungent smell.',
    'I am a key raw material for fertilisers.',
    'I am made industrially by the Haber process.',
    'My molecules are trigonal pyramidal, and I turn damp red litmus paper blue.',
  ]),
  compound('Methane', null, 'CH₄', [
    'I am the main component of natural gas.',
    'I am a greenhouse gas.',
    'My molecules are tetrahedral.',
    'I am the simplest hydrocarbon.',
  ]),
  compound('Carbon dioxide', null, 'CO₂', [
    'Plants take me in during photosynthesis.',
    'I put the fizz in fizzy drinks.',
    'My molecules are linear and nonpolar overall.',
    'My solid form, dry ice, sublimes at about −78 °C.',
  ]),
  compound('Benzene', null, 'C₆H₆', [
    'I am a colourless, sweet-smelling liquid, and I am carcinogenic.',
    'My molecules are flat rings.',
    'All my carbon–carbon bonds are the same length, between a single and a double bond.',
    'Kekulé proposed my ring structure.',
  ]),
  compound('Propanone', 'acetone', 'CH₃COCH₃', [
    'I am found in many nail polish removers.',
    'I am a good solvent and I mix freely with water.',
    'My molecules have a C=O group between two carbon atoms.',
    'I boil at about 56 °C.',
  ]),
  compound('Ethanoic acid', 'acetic acid', 'CH₃COOH', [
    'I give vinegar its sour taste.',
    'I am a weak acid.',
    'My pure form freezes at about 17 °C into ice-like crystals, so it is called glacial.',
    'My molecules have a –COOH group on a two-carbon chain.',
  ]),
  compound('Sodium chloride', null, 'NaCl', [
    'I am used to season and preserve food.',
    'I am an ionic compound with a giant lattice structure.',
    'I conduct electricity when molten or dissolved in water, but not as a solid.',
    'I melt at about 801 °C.',
  ]),
  compound('Hydrogen peroxide', null, 'H₂O₂', [
    'I am used as a bleach and a mild disinfectant.',
    'I slowly break down into water and oxygen.',
    'Manganese(IV) oxide speeds up that breakdown without being used up.',
    'My molar mass is about 34 g/mol.',
  ]),
  compound('Sulfuric acid', null, 'H₂SO₄', [
    'I am one of the most widely made industrial chemicals.',
    'I am made industrially by the Contact process.',
    'I am a dense, oily liquid, and a powerful dehydrating agent.',
    'I am the acid in lead–acid car batteries.',
  ]),
]