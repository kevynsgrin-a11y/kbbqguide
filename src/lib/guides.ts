import {
  createDraftNonRecipePublication,
  type NonRecipePublication,
} from './nonrecipe-publication-governance';

export interface GuideSection {
  readonly heading: string;
  readonly body: string;
  readonly checklist: readonly string[];
}

export interface Guide {
  readonly id: `G${string}`;
  readonly title: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly sections: readonly GuideSection[];
  readonly safetyNote: string;
  readonly relatedIds: readonly string[];
  readonly publication: NonRecipePublication;
}

/** The guide index is an editorial record, not an automatic launch surface. */
export const guidesIndexPublication = createDraftNonRecipePublication();

const guideDrafts: readonly Omit<Guide, 'publication'>[] = [
  {
    id: 'G01',
    title: 'Korean BBQ at Home for Beginners',
    description:
      'A calm first-night plan for choosing a small menu, setting up the table, sequencing prep, and keeping raw and ready-to-eat foods separate.',
    eyebrow: 'Start small, stay organized',
    sections: [
      {
        heading: 'Build one balanced table',
        body: 'Begin with one grilled centerpiece, one sauce, one fresh element, and two make-ahead banchan. Variety comes from contrast, not from trying to cook every dish at once.',
        checklist: [
          'Choose one meat or seafood recipe as the main cooking task.',
          'Add ssam greens or a crisp salad to refresh the palate.',
          'Use banchan that can be completed before guests arrive.',
        ],
      },
      {
        heading: 'Assign clean and raw zones',
        body: 'Give raw ingredients, cooking tools, and finished food distinct places before the grill is hot. This makes the service flow easier to understand and reduces cross-contact.',
        checklist: [
          'Set out separate raw and cooked platters and utensils.',
          'Keep ready-to-eat greens and sauces away from the raw station.',
          'Place a calibrated thermometer beside the cooking tools.',
        ],
      },
      {
        heading: 'Cook in small batches',
        body: 'A crowded cooking surface steams food, slows browning, and makes doneness harder to judge. Refill the grill gradually and let each batch finish before transferring it to a clean platter.',
        checklist: [
          'Preheat according to the appliance manufacturer.',
          'Use recipe time, sensory cues, and temperature together.',
          'Pause to scrape or wipe only as the appliance manual permits.',
        ],
      },
      {
        heading: 'Use the plan, not the clock alone',
        body: 'Complete cold dishes first, arrange the table next, and leave active grilling for service. The linked menus and timeline tool turn that sequence into a guest-count plan.',
        checklist: [
          'Read every recipe fully before shopping.',
          'Check labels for each guest rather than assuming a dish is allergen-free.',
          'Print recipes or keep the no-JavaScript content available as a fallback.',
        ],
      },
    ],
    safetyNote:
      'Use only an appliance explicitly approved by its manufacturer for the intended indoor or outdoor setting. Charcoal, propane, outdoor grills, and camping stoves never belong indoors.',
    relatedIds: ['SYS_MENUS', 'SYS_TOOLS', 'G02', 'G03'],
  },
  {
    id: 'G02',
    title: 'Indoor vs. Outdoor Korean BBQ Safety',
    description:
      'A setting-first decision guide covering appliance approval, carbon-monoxide boundaries, ventilation, clearances, and raw-food controls.',
    eyebrow: 'The appliance decides the setting',
    sections: [
      {
        heading: 'Read the manufacturer’s setting rule',
        body: '“Tabletop” does not automatically mean indoor-safe. The manual and product labeling determine whether an appliance may be used indoors, outdoors, or only in a specific environment.',
        checklist: [
          'Confirm approved location, clearances, surface, and power or fuel requirements.',
          'Do not improvise indoor use for an outdoor appliance.',
          'Keep the manual accessible during setup and cleanup.',
        ],
      },
      {
        heading: 'Keep combustion outdoors',
        body: 'Charcoal and fuel-burning outdoor equipment can produce dangerous carbon monoxide. An open window, range hood, fan, or carbon-monoxide alarm does not convert prohibited equipment into an indoor-safe appliance.',
        checklist: [
          'Use charcoal, propane, and outdoor grills only outdoors.',
          'Keep outdoor equipment away from doors, windows, and enclosed areas.',
          'Never use a camping stove as a dining-room burner.',
        ],
      },
      {
        heading: 'Control heat, grease, and traffic',
        body: 'Set the cooking surface on a stable, heat-safe base with the required clearances. Route cords away from walkways, keep children and pets outside the cooking zone, and never leave active equipment unattended.',
        checklist: [
          'Clear paper, fabric, aerosols, and other combustibles.',
          'Use only drip trays and grease controls specified by the maker.',
          'Let the unit cool fully before moving or cleaning it.',
        ],
      },
      {
        heading: 'Apply the same food controls everywhere',
        body: 'Outdoor cooking does not relax temperature or cross-contact rules. Keep raw food cold until needed, use separate utensils, and verify doneness with a calibrated thermometer.',
        checklist: [
          'Carry raw and cooked food on separate platters.',
          'Discard raw-contact marinade unless a reviewed recipe safely handles it.',
          'Refrigerate perishable leftovers promptly under the recipe guidance.',
        ],
      },
    ],
    safetyNote:
      'This draft follows the project safety standard and requires final human review against current CPSC, USDA, local fire-code, and appliance-manufacturer guidance before publication.',
    relatedIds: ['G03', 'G11', 'SYS_TOOLS', 'SYS_START'],
  },
  {
    id: 'G03',
    title: 'Tabletop Grill and Ventilation Guide',
    description:
      'A feature-neutral checklist for selecting and positioning a manufacturer-approved appliance without making invented product claims.',
    eyebrow: 'Match equipment to the room',
    sections: [
      {
        heading: 'Filter by approval before features',
        body: 'Start with the stated use environment, electrical or fuel requirements, temperature controls, clearances, and cleaning instructions. Size and aesthetics matter only after those constraints pass.',
        checklist: [
          'Verify the model is approved for the intended setting.',
          'Confirm circuit and outlet requirements without extension-cord improvisation.',
          'Check that replacement trays or approved cleaning parts are obtainable.',
        ],
      },
      {
        heading: 'Plan airflow without overclaiming it',
        body: 'Ventilation can help manage normal cooking vapor and odor, but it never makes an outdoor or combustion appliance safe indoors. Follow both the appliance and ventilation-system instructions.',
        checklist: [
          'Use a functioning hood or room ventilation where appropriate.',
          'Keep required appliance clearances unobstructed.',
          'Stop use if the manual’s conditions cannot be met.',
        ],
      },
      {
        heading: 'Choose a workable cooking area',
        body: 'The table needs a stable heat-safe zone for the appliance plus separate landing areas for raw food, clean platters, utensils, and the thermometer.',
        checklist: [
          'Keep cords and hot handles out of guest traffic.',
          'Place splatter-prone cooking away from walls and fabrics.',
          'Do not crowd vents, controls, or grease channels.',
        ],
      },
      {
        heading: 'Test the setup before hosting',
        body: 'Run the approved appliance empty or with a small test batch exactly as its manual directs. Confirm reach, seating, glare, ventilation, circuit stability, and cleanup access before adding guests.',
        checklist: [
          'Calibrate the food thermometer separately.',
          'Practice transferring food to a clean platter.',
          'Record any manual-specific restrictions in the event checklist.',
        ],
      },
    ],
    safetyNote:
      'No product recommendation, performance comparison, electrical advice, or indoor-use approval is implied. Verify the exact model, manual, home conditions, and local requirements.',
    relatedIds: ['G02', 'G11', 'SYS_TOOLS', 'G01'],
  },
  {
    id: 'G04',
    title: 'Essential Korean Pantry Guide',
    description:
      'A label-first pantry map for fermented pastes, soy sauces, sesame, chile, vinegars, sweeteners, and storage decisions.',
    eyebrow: 'Buy for recipes, not a fantasy shelf',
    sections: [
      {
        heading: 'Start with the recipe labels',
        body: 'Gochujang, doenjang, ganjang, toasted sesame oil, gochugaru, and rice vinegar cover many recipes in this collection, but brands differ in salt, sweetness, heat, fermentation, and allergens.',
        checklist: [
          'Compare ingredient and allergen labels every time you buy.',
          'Choose gochugaru form and heat level specified by the recipe.',
          'Do not treat soy sauce, soup soy sauce, and seasoning sauce as identical.',
        ],
      },
      {
        heading: 'Build around three flavor jobs',
        body: 'Fermented pastes bring body and depth, soy-based seasonings bring salt and savoriness, and fresh aromatics create the top notes. Sweetener, acid, sesame, and chile adjust the balance.',
        checklist: [
          'Keep garlic, scallions, ginger, and onion in the active plan.',
          'Taste a clean portion before it touches raw food.',
          'Adjust only within the recipe’s stated ranges during testing.',
        ],
      },
      {
        heading: 'Store by package direction',
        body: 'Refrigeration, shelf life, and handling vary by product. The package and manufacturer instructions take priority over a generic pantry rule.',
        checklist: [
          'Date opened containers without inventing an expiration date.',
          'Use clean dry utensils to reduce contamination.',
          'Discard products showing spoilage or compromised packaging.',
        ],
      },
      {
        heading: 'Plan substitutions honestly',
        body: 'A substitution can change salt, texture, fermentation character, heat, and allergen exposure. Call it an adaptation and retest the finished recipe rather than claiming equivalence.',
        checklist: [
          'Use certified alternatives when a recipe specifically permits them.',
          'Recheck every prepared sauce for wheat, soy, fish, or shellfish.',
          'Keep original and substitute containers available for guest label review.',
        ],
      },
    ],
    safetyNote:
      'Ingredient labels and manufacturing lines can change. The allergen tool is a planning filter, not a guarantee of medical safety or absence of cross-contact.',
    relatedIds: ['G01', 'G07', 'SYS_TOOLS', 'SYS_RECIPES'],
  },
  {
    id: 'G05',
    title: 'Korean BBQ Meat Cuts Guide',
    description:
      'A preparation-focused guide to matching thickness, marbling, grain, marinade, and thermometer technique to the recipe.',
    eyebrow: 'Cut and method work together',
    sections: [
      {
        heading: 'Shop by recipe specification',
        body: 'The cut name alone does not describe thickness, trimming, bone, or grain direction. Show the recipe specification to the butcher and confirm whether the packaged cut matches it.',
        checklist: [
          'Check thickness and bone style before purchase.',
          'Keep raw meat cold during transport and preparation.',
          'Do not substitute ground meat for intact cuts without a reviewed recipe change.',
        ],
      },
      {
        heading: 'Use thickness to control pace',
        body: 'Thin slices cook quickly and reward small batches; thicker intact cuts need room, turning control, thermometer access, and any required rest.',
        checklist: [
          'Partially chill only when the recipe uses it for safer slicing control.',
          'Cut against the grain where the recipe directs.',
          'Keep portions evenly thick so cues are meaningful.',
        ],
      },
      {
        heading: 'Keep marinades refrigerated',
        body: 'Mix and reserve any clean serving portion before raw meat contact. Marinate under refrigeration in a food-safe container and follow the recipe’s maximum practical window.',
        checklist: [
          'Label raw-contact containers and tools.',
          'Discard raw-contact marinade by default.',
          'Never return cooked meat to the raw platter.',
        ],
      },
      {
        heading: 'Verify doneness by meat type',
        body: 'Minimum temperature and rest rules differ for intact beef or pork, ground meat, and poultry. Measure the thickest appropriate point and use the recipe’s sensory cues as supporting evidence.',
        checklist: [
          'Calibrate and clean the thermometer.',
          'Check multiple pieces when thickness varies.',
          'Follow the recipe’s explicit minimum and rest instruction.',
        ],
      },
    ],
    safetyNote:
      'The recipe-specific temperature rule controls. Color, grill marks, texture, and time alone are not reliable proof of safety.',
    relatedIds: ['CAT_MEAT', 'G02', 'G08', 'SYS_TOOLS'],
  },
  {
    id: 'G06',
    title: 'Seafood Buying, Cleaning, and Grilling Guide',
    description:
      'Species-aware planning for purchasing, cold holding, cleaning, surface preparation, sticking prevention, and doneness checks.',
    eyebrow: 'Follow the species-specific recipe',
    sections: [
      {
        heading: 'Buy from a reliable cold chain',
        body: 'Use the recipe’s buying cues for the exact fish or shellfish. Packaging, smell, flesh, shell condition, and live-shell behavior can matter differently by species.',
        checklist: [
          'Keep seafood cold and transport it promptly.',
          'Reject damaged packaging or obvious spoilage.',
          'For live shellfish, follow the recipe and seller handling instructions.',
        ],
      },
      {
        heading: 'Thaw and clean deliberately',
        body: 'Use the recipe’s refrigerator-thawing and cleaning method. Avoid splashing raw seafood water onto sinks, utensils, greens, sauces, or finished dishes.',
        checklist: [
          'Use a dedicated board and cleanable work area.',
          'Pat dry only with single-use or immediately laundered material.',
          'Wash hands and sanitize the area before ready-to-eat prep resumes.',
        ],
      },
      {
        heading: 'Prepare the cooking surface',
        body: 'Drying, oiling, preheating, skewering, scoring, baskets, or shell orientation are species- and recipe-specific controls. Use the method stated in the recipe rather than one universal trick.',
        checklist: [
          'Start with clean grates or the approved cooking plate.',
          'Use only the oil amount and heat range the method calls for.',
          'Release food only when the recipe cues indicate it is ready.',
        ],
      },
      {
        heading: 'Combine temperature and sensory cues',
        body: 'Fin fish guidance differs from shellfish guidance, and shell-opening rules apply only where the reviewed method says they do. The recipe must state the applicable temperature and physical cues.',
        checklist: [
          'Measure where the recipe directs without touching bone or shell.',
          'Use opacity, firmness, flaking, or shell behavior only as supporting cues.',
          'Discard unopened shells when the reviewed recipe requires it.',
        ],
      },
    ],
    safetyNote:
      'Higher-risk guests may need to avoid raw or undercooked seafood. This guide is not individualized medical advice; use the recipe’s reviewed guidance and a qualified clinician when needed.',
    relatedIds: ['CAT_SEAFOOD', 'G02', 'G12', 'SYS_TOOLS'],
  },
  {
    id: 'G07',
    title: 'Ssam Greens, Herbs, and Wraps Guide',
    description:
      'A practical map for selecting, washing, drying, arranging, and combining crisp wraps and aromatic herbs.',
    eyebrow: 'Fresh contrast at the center',
    sections: [
      {
        heading: 'Choose varied shapes and flavors',
        body: 'Tender lettuces make flexible wraps, sturdier leaves add snap, and aromatic herbs contribute distinct character. The platter can be abundant without insisting on one canonical combination.',
        checklist: [
          'Choose intact leaves without visible spoilage.',
          'Offer mild and aromatic options separately.',
          'Identify unfamiliar herbs rather than treating them as decoration.',
        ],
      },
      {
        heading: 'Wash before the raw station opens',
        body: 'Prepare ready-to-eat produce in a clean sink and work area before raw meat or seafood arrives. Follow package directions for prewashed products.',
        checklist: [
          'Rinse loose produce under clean running water.',
          'Dry thoroughly for better texture and sauce adhesion.',
          'Use clean towels, spinner, bowl, and platter.',
        ],
      },
      {
        heading: 'Arrange for easy reaching',
        body: 'Keep greens cool until service, then place smaller platters around the table rather than one overloaded pile beside the raw-food zone.',
        checklist: [
          'Separate delicate herbs from heavy leaves.',
          'Refill from a refrigerated reserve as needed.',
          'Use clean serving utensils and hands.',
        ],
      },
      {
        heading: 'Build a balanced bite',
        body: 'A small piece of grilled food, a modest amount of sauce, a fresh aromatic, and one contrasting banchan can fit comfortably in a leaf. Guests should be free to compose their own bites.',
        checklist: [
          'Keep sauce portions small enough to avoid masking other flavors.',
          'Offer rice separately rather than prescribing one method.',
          'Replace wilted or contaminated leaves promptly.',
        ],
      },
    ],
    safetyNote:
      'The platter is ready-to-eat food. Keep it physically separate from raw ingredients, raw-contact hands, splatter, utensils, and marinades.',
    relatedIds: ['F01', 'G04', 'G08', 'SYS_MENUS'],
  },
  {
    id: 'G08',
    title: 'Menus and Shopping Lists for 2, 4, and 8 Guests',
    description:
      'A guest-count framework that keeps variety, workload, grill capacity, dietary labels, and consolidated shopping in balance.',
    eyebrow: 'Scale the work as well as the food',
    sections: [
      {
        heading: 'Two guests: keep it intimate',
        body: 'One centerpiece, two supporting dishes, a sauce, and a simple finish give the table contrast without creating a refrigerator full of open tasks.',
        checklist: [
          'Choose recipes that share a few ingredients.',
          'Use one active grill task at a time.',
          'Review the menu-for-two shopping list before scaling.',
        ],
      },
      {
        heading: 'Four guests: add one lane',
        body: 'A second cooked item or a more substantial banchan expands the table while one person can still manage the grill if cold dishes are finished early.',
        checklist: [
          'Assign one person to clean-platter and table replenishment.',
          'Confirm the appliance can recover heat between batches.',
          'Keep dietary labels visible at the table.',
        ],
      },
      {
        heading: 'Eight guests: duplicate access, not chaos',
        body: 'A larger group needs more serving points, clearer raw/cooked roles, and a longer batch sequence. A second approved appliance changes electrical, clearance, supervision, and traffic requirements and must be planned explicitly.',
        checklist: [
          'Use multiple small platters for greens, sauces, and banchan.',
          'Assign dedicated raw and cooked handlers.',
          'Do not overload circuits or use unapproved cord arrangements.',
        ],
      },
      {
        heading: 'Generate, then verify',
        body: 'The planner consolidates quantities from the selected recipe records. It cannot know package sizes, appetite, waste, substitutions, label changes, or the result of required test cooking.',
        checklist: [
          'Open each linked recipe and verify its yield.',
          'Recheck allergen and cross-contact notes for every guest.',
          'Edit the list after inventorying the pantry.',
        ],
      },
    ],
    safetyNote:
      'Scaling changes quantity, not food-safety minimums, appliance approval, marination limits, or the need to check the thickest pieces with a thermometer.',
    relatedIds: ['SYS_MENUS', 'SYS_TOOLS', 'G09', 'G01'],
  },
  {
    id: 'G09',
    title: 'Two-Day, One-Day, and Two-Hour Prep Timelines',
    description:
      'Three runway options that move shopping, cold dishes, marination, table setup, and final grilling into a safe sequence.',
    eyebrow: 'Work backward from service',
    sections: [
      {
        heading: 'Two days: absorb the uncertainty',
        body: 'Use the first day to confirm labels, equipment, refrigerator space, and make-ahead dishes whose recipes permit it. This runway leaves time to replace a missing ingredient or unsuitable appliance.',
        checklist: [
          'Read every recipe and create the consolidated list.',
          'Check appliance manuals and thermometer calibration.',
          'Complete only recipe-approved long-lead preparations.',
        ],
      },
      {
        heading: 'One day: protect cold storage',
        body: 'Prepare stable banchan and sauces, organize raw ingredients in leak-resistant containers, and reserve clean serving sauce before any raw contact.',
        checklist: [
          'Keep raw food below and away from ready-to-eat items.',
          'Label containers with dish and service role.',
          'Wash and dry greens before the raw prep zone opens.',
        ],
      },
      {
        heading: 'Two hours: stop adding dishes',
        body: 'At this point, shift from ambition to execution. Finish cold dishes, set the clean and raw stations, prepare only recipes whose safe marination and timing windows fit, and preheat at the manufacturer-specified time.',
        checklist: [
          'Chill finished cold food until service.',
          'Place thermometer, clean platter, and separate tongs at the grill.',
          'Do not shortcut refrigerator marination with room-temperature holding.',
        ],
      },
      {
        heading: 'Service: cook, verify, replenish',
        body: 'Cook in manageable batches, transfer with clean utensils, and replenish small platters from protected reserves. Move leftovers into the recipe’s storage process rather than leaving them on the warm table.',
        checklist: [
          'Keep raw and cooked handlers distinct where possible.',
          'Verify recipe-specific temperature and rest requirements.',
          'Begin cleanup only after equipment is switched off and safely cooling.',
        ],
      },
    ],
    safetyNote:
      'A timeline never overrides recipe-specific refrigeration, marination, cooking, cooling, storage, or appliance-manufacturer instructions.',
    relatedIds: ['SYS_TOOLS', 'SYS_MENUS', 'G10', 'G11'],
  },
  {
    id: 'G10',
    title: 'Banchan Batch-Prep Guide',
    description:
      'A workload-first system for grouping cold, cooked, seasoned, and fermented side dishes without flattening their individual storage rules.',
    eyebrow: 'Batch the motions, not the safety rules',
    sections: [
      {
        heading: 'Select dishes with different jobs',
        body: 'Choose one crisp or fresh side, one cooked vegetable, and one deeper fermented or braised element. Too many dishes with the same texture or last-minute step create work without adding useful contrast.',
        checklist: [
          'Check each recipe’s make-ahead and storage section.',
          'Limit the number of hot finishing steps.',
          'Choose at least one low-attention preparation.',
        ],
      },
      {
        heading: 'Sequence clean produce first',
        body: 'Wash, dry, and cut ready-to-eat produce before handling raw egg, meat, seafood, or fish-based ingredients. Reset and sanitize the area between incompatible tasks.',
        checklist: [
          'Use separate boards and utensils as required.',
          'Keep allergen-containing seasonings labeled.',
          'Avoid reusing tasting spoons.',
        ],
      },
      {
        heading: 'Cool and store by recipe',
        body: 'Small dishes do not share one universal cooling or storage window. Follow each recipe’s container, refrigeration, and make-ahead guidance and retain its identity after portioning.',
        checklist: [
          'Label the dish and preparation date for household tracking.',
          'Use shallow containers where the reviewed recipe directs rapid cooling.',
          'Do not combine old and newly made batches.',
        ],
      },
      {
        heading: 'Portion for service',
        body: 'Serve smaller amounts and refill from a protected refrigerated reserve. This keeps the table less crowded and reduces repeated contact with the full batch.',
        checklist: [
          'Use a clean utensil for each dish.',
          'Replace contaminated serving utensils immediately.',
          'Follow the recipe when deciding whether leftovers may be stored.',
        ],
      },
    ],
    safetyNote:
      'Fermented, pickled, cooked, egg-based, seafood-based, and fresh dishes have different controls. Never infer shelf stability from flavor, acidity, saltiness, or tradition alone.',
    relatedIds: ['CAT_BANCHAN', 'G09', 'G12', 'SYS_MENUS'],
  },
  {
    id: 'G11',
    title: 'Cleanup, Grease, Smoke, and Odor-Control Guide',
    description:
      'A before-during-after cleanup plan that respects appliance cooling, grease handling, ventilation limits, and food-contact sanitation.',
    eyebrow: 'Design cleanup before heat',
    sections: [
      {
        heading: 'Prepare the room and tools',
        body: 'Clear nearby combustibles and clutter, protect only surfaces the appliance manual permits, and place raw-contact cleanup supplies away from food and tableware.',
        checklist: [
          'Confirm grease tray placement before preheating.',
          'Keep paper products and fabrics away from heat.',
          'Set out a container for raw-contact utensils.',
        ],
      },
      {
        heading: 'Manage cooking residue safely',
        body: 'Use the manufacturer’s instructions for scraping, draining, or replacing liners. Do not pour water onto hot grease or use an improvised cleaner on an active appliance.',
        checklist: [
          'Reduce batch size if residue is building too quickly.',
          'Stop and cool the appliance if the manual requires it before service.',
          'Keep clean utensils separate during any mid-service reset.',
        ],
      },
      {
        heading: 'Ventilate within the safe setting',
        body: 'Continue appropriate ventilation for normal residual odor only as the appliance and building systems allow. Ventilation is not a remedy for using prohibited combustion equipment indoors.',
        checklist: [
          'Keep the approved airflow path unobstructed.',
          'Do not leave active cooking equipment unattended while airing the room.',
          'Treat unexpected heavy smoke as a stop-and-assess condition.',
        ],
      },
      {
        heading: 'Cool, clean, then store',
        body: 'Switch off and unplug or shut down exactly as directed, keep people away from hot surfaces, and wait for the specified cooling state before disassembly or movement.',
        checklist: [
          'Dispose of grease according to local and manufacturer guidance.',
          'Clean food-contact parts with approved methods.',
          'Dry components fully before reassembly and storage.',
        ],
      },
    ],
    safetyNote:
      'Never move, immerse, disassemble, or add liquid to a hot appliance unless its manual explicitly directs that action.',
    relatedIds: ['G02', 'G03', 'G09', 'SYS_TOOLS'],
  },
  {
    id: 'G12',
    title: 'Leftovers, Storage, and Next-Day Meals Guide',
    description:
      'A recipe-specific framework for deciding what can be saved, separating components, cooling, labeling, reheating, and discarding uncertainty.',
    eyebrow: 'Store components with their identities',
    sections: [
      {
        heading: 'Decide before service',
        body: 'Read each recipe’s storage and leftover sections before cooking. Some fresh, dressed, shellfish, egg, or table-held components may not be good or appropriate candidates for saving.',
        checklist: [
          'Reserve untouched portions before they reach the table when appropriate.',
          'Keep raw marinade and raw-contact sauces out of the leftover plan.',
          'Use clean containers sized for the remaining quantity.',
        ],
      },
      {
        heading: 'Separate incompatible textures',
        body: 'Store grilled food, rice, greens, sauces, and crisp banchan separately when the recipes permit. This preserves identity and lets each item follow its own reheating or no-reheat instruction.',
        checklist: [
          'Do not mix fresh greens into warm leftovers.',
          'Keep sauce labels and allergen information with the container.',
          'Avoid combining batches made on different days.',
        ],
      },
      {
        heading: 'Cool and label promptly',
        body: 'Follow the recipe’s cooling, container, and refrigeration guidance. A household label should identify the dish and preparation date without pretending to establish a universal safety deadline.',
        checklist: [
          'Use shallow containers where rapid cooling is directed.',
          'Keep refrigerator airflow and raw-food separation intact.',
          'Discard food that was mishandled rather than trying to rescue it.',
        ],
      },
      {
        heading: 'Reheat only as directed',
        body: 'Use the recipe’s reheating method and sensory cues; some dishes should be served cold, refreshed, or not stored at all. Reheating does not erase unsafe holding or cross-contact.',
        checklist: [
          'Reheat only the portion you plan to use.',
          'Use a clean utensil and serving dish.',
          'When handling history is uncertain, discard the food.',
        ],
      },
    ],
    safetyNote:
      'This guide intentionally avoids one universal leftovers deadline. The reviewed recipe and current official cold-storage guidance must determine the control for each dish.',
    relatedIds: ['G10', 'G09', 'SYS_RECIPES', 'SYS_TOOLS'],
  },
];

/**
 * Every inherited guide record is explicitly an unpublished draft until its
 * own named review evidence is entered. No reviewer or publication fact is
 * inferred from the text of a guide.
 */
export const guides: readonly Guide[] = guideDrafts.map((guide) => ({
  ...guide,
  publication: createDraftNonRecipePublication(),
}));

export function guideById(id: string): Guide {
  const guide = guides.find((candidate) => candidate.id === id);
  if (!guide) throw new Error(`Unknown guide ID: ${id}`);
  return guide;
}
