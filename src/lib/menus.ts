import {
  createDraftNonRecipePublication,
  type NonRecipePublication,
} from './nonrecipe-publication-governance';

export interface MenuPlan {
  readonly id: 'MENU_2' | 'MENU_4' | 'MENU_8';
  readonly guests: 2 | 4 | 8;
  readonly title: string;
  readonly description: string;
  readonly recipeIds: readonly string[];
  readonly serviceOrder: readonly string[];
  readonly equipment: readonly string[];
  readonly publication: NonRecipePublication;
}

/** The menu index requires its own review record before public indexing. */
export const menusIndexPublication = createDraftNonRecipePublication();

const menuDrafts: readonly Omit<MenuPlan, 'publication'>[] = [
  {
    id: 'MENU_2',
    guests: 2,
    title: 'A focused Korean BBQ table for two',
    description:
      'One quick-cooking centerpiece, a crisp wrap platter, a make-ahead vegetable side, ssamjang, and a warm finish.',
    recipeIds: ['M01', 'B05', 'F01', 'SA01', 'D01'],
    serviceOrder: [
      'Complete the banchan and ssamjang, then refrigerate as their recipes direct.',
      'Wash and dry the ssam platter before opening the raw-meat station.',
      'Cook bulgogi in small batches and transfer it to a clean platter.',
      'Make the dessert only after the grill is safely shut down or on a separate approved surface.',
    ],
    equipment: [
      'One manufacturer-approved cooking appliance',
      'Calibrated instant-read thermometer',
      'Separate raw and cooked platters and utensils',
      'Four small serving bowls and two place settings',
    ],
  },
  {
    id: 'MENU_4',
    guests: 4,
    title: 'A varied Korean BBQ table for four',
    description:
      'Pork and shrimp share the table with spinach, braised potatoes, scallion salad, a clean dipping sauce, and chilled sikhye.',
    recipeIds: ['M10', 'SF01', 'B06', 'B09', 'F02', 'SA04', 'D05'],
    serviceOrder: [
      'Prepare sikhye, braised potatoes, spinach, and clean dipping sauce within their recipe windows.',
      'Finish scallion salad close to service and keep it away from raw-food prep.',
      'Cook pork and seafood in separate controlled batches with clean transitions.',
      'Serve chilled dessert from a protected refrigerated reserve.',
    ],
    equipment: [
      'One appropriately sized manufacturer-approved cooking appliance',
      'Calibrated instant-read thermometer',
      'Dedicated seafood and meat prep tools',
      'Separate raw platters plus clean cooked-food platters',
      'Small serving dishes placed at both ends of the table',
    ],
  },
  {
    id: 'MENU_8',
    guests: 8,
    title: 'A staged Korean BBQ table for eight',
    description:
      'Two meats and grilled fish anchor a larger spread of kimchi, tofu, zucchini, wraps, pear-cucumber salad, two sauces, and yakgwa.',
    recipeIds: [
      'M03',
      'M17',
      'SF07',
      'B01',
      'B10',
      'B15',
      'F01',
      'F06',
      'SA01',
      'SA05',
      'D03',
    ],
    serviceOrder: [
      'Complete approved make-ahead banchan, sauces, and dessert before the event day where their recipes allow.',
      'Set duplicate clean serving points and label raw, cooked, meat, and seafood tools.',
      'Grill in a planned sequence, resetting the approved surface only as its manual permits.',
      'Replenish table dishes from protected reserves instead of placing full batches in the active cooking zone.',
    ],
    equipment: [
      'Manufacturer-approved appliance capacity matched to the group',
      'A second appliance only if circuits, clearances, supervision, and manuals all permit it',
      'Two calibrated thermometers or a documented cleaning transition',
      'Dedicated raw and cooked handlers and clearly separated platters',
      'Duplicate serving bowls for greens, sauces, and banchan',
    ],
  },
];

/**
 * Menu plans are individual unpublished records. The referenced recipe list
 * never substitutes for named review evidence on the menu itself.
 */
export const menus: readonly MenuPlan[] = menuDrafts.map((menu) => ({
  ...menu,
  publication: createDraftNonRecipePublication(),
}));

export function menuByGuests(guests: number): MenuPlan {
  const menu = menus.find((candidate) => candidate.guests === guests);
  if (!menu) throw new Error(`Unsupported guest count: ${guests}`);
  return menu;
}
