"use server";

import {
  Config,
  configSchema,
  explanationsSchema,
  Result,
  SqlQuery,
} from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";
import { luna } from "@/lib/luna-provider";
import { openai } from "@ai-sdk/openai";


// Create a Luna backend instance

export async function generateQuery(
  query: string,
  context?: any,
): Promise<SqlQuery[]> {
  "use server";
  try {
    // Prepare messages array for the conversation
    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [];

    // Add system message
    messages.push({
      role: "system",
      content: `You are a SQL (postgres) and data visualization expert. Your job is to help the user write SQL queries to retrieve the data they need. The database contains the following tables and schemas:

        The context is that we have all underlying sales and costs data for a brewery/restaurant. Your ultimate goal is to help generate insights for the brewery owner/manager so they can make adjustments to their operations to maximize profits (sales - costs). Below are the descriptions of various tables in the database.

        Table: time_entries: The time_entries table is a daily table and primarily a cost table that contains information about employee work shifts, including the employee details, hours worked, wages, and tips. Important columns are out_date that we use for daily hours/shifts etc and also a join key in case we need a datewise join with item_selection_details, or costs tables

    Schema:
    table_name    column_name data_type meaning
        time_entries    location    text    location
        time_entries    job_title   text    title
        time_entries    employee_id text 
        time_entries    employee text name of employee
        time_entries    in_date timestamp without time zone in_date
        time_entries    total_hours numeric total hours
        time_entries    total_gratuity  numeric total_gratuity
        time_entries    total_tips  numeric total_tips
        time_entries    tips_withheld   numeric tips_withheld
        time_entries    wage    numeric wage
        time_entries    regular_hours   numeric regular_hours
        time_entries    overtime_hours  numeric overtime_hours
        time_entries    regular_pay numeric regular_pay
        time_entries    overtime_pay    numeric overtime_pay
        time_entries    total_pay   numeric total_pay



    Table: item_selection_details: The item_selection_details table is also a daily table and is probably the most important table because it contains the entire sales data. Every row is a sales from POS that is logged into this table. So this table contains information about food/beverage orders, their prices, and details about the dining experience. The datewise join keys are sent_date, and we can have other join key on menu_item for menu_mappings.

      Schema:
       table_name   column_name data_type   meaning
        item_selection_details  location    text    location
        item_selection_details  order_date  timestamp without time zone order date
        item_selection_details  dining_area text    dining area
        item_selection_details  menu_item   text    index menu_mappings.menu_item
        item_selection_details  menu_group  text    index menu_mappings.menu_group
        item_selection_details  sales_category  text    category
        item_selection_details  net_price   numeric net price
        item_selection_details  qty integer quantity
        item_selection_details  void text    is null or false


    Table: menu_mappings - This is a supporting mapping table for item_selection_details to map the menu_item from that table, which could have a bunch of permutations on the menu_item name, so we have this to standardize the menu_item to product_name and type.It provides standardized mappings between the adhoc menu item names in item_selection_details.menu_item and standardized product names, essential for accurate analytics.

      Schema:
      table_name    column_name data_type   meaning
        menu_mappings   menu_item   text    index item_selection_details.menu_item
        menu_mappings   menu_group  text    index item_selection_details.menu_group
        menu_mappings   business_line   text    business_line
        menu_mappings   category    text    category
        menu_mappings   product_name    text    product_name
        menu_mappings   product_type    text    product_type

            groupings for menu_mappings
            Categories('Soft Drinks', 'Special - Bowl', 'Food', 'Wholesale', 'Error', 'Dessert', '4 Pk', 'Pitcher', 'Merch', '3rd Party NA', 'Special - Plate', 'Just a Taste', 'Bottle', 'Sandwich', 'Draft', 'Meat by the Pound', 'Flight', 'Special - Sandwich', 'Fee/Misc', 'Gift Certificate', 'Salad', 'Half Barrell', 'Food and Draft', 'Flight Single', '1/2 Case', 'Half Pour', '3rd Party Alcohol', 'Cans', 'Catering', 'Add Ons', 'Sixtel', 'Sides', 'Inflation Buster', 'Family Pack', 'Crowler', 'Add ons', 'Full Pour', 'Plate', 'Case', 'Tours')

            product_name('Spill the Tea Saison', 'Punks & Poets Imperial Stout w/ Coffee & Vanilla', 'Side', 'Power Disco DIPA', 'Candle', 'TShirt', 'Too Late For 'Pologize Pineapple IPA', 'Sixtel Credit', 'Pulled Chicken or Pork', 'Sunday Beers', 'DSSOLVR - Biscotti From Above 2020 case(deleted)', 'Beef n Cheddar', 'Biscuits & Gravy', 'Ego Is Not Your Friend DIPA', '3 Year Anniversary Ticket(food only)', 'Saison Flight', '13th Hour Imperial Stout', 'Radical Empathy Belgian w / Cherries', 'Wings', 'Lit Spritz Dark Hard Seltzer', 'CC Fee', 'Chicken Dumplings', 'Dodgy Gobby English Pale', 'Tangy Mustard', 'Sampler', 'Mayo', '12pack Shipping', 'Chicken Skewers', 'Pi Day Flight and Bite', 'Air Piano Pale Ale', 'Wine', 'Pint / PORK Sandwich', 'Disco Lemonade Dry Hopped Sour IPA', 'Sunday Pint / CHICKEN Sandwich', 'Keg Deposit', 'Kombucha Can', 'Pie', 'When Stars Align DIPA', 'Fernweh Farmhouse Saison', 'Mousse', 'Fairly Lively Irish Red Ale', 'Pickled Ocra', 'Fried Chicken', 'Tapple', 'Pork Shank', 'Honey Cornbread', 'Might Get Loud Hazy IPA', 'Sweet and Sour Brisket Sandwich', 'Spicey Vinegar', 'Punks & Poets Imperial Stout', 'Roasted Tomato Vinagrette', 'Heads Will Roll Imperial Stout', 'Green Salad w SLBR', 'Mellow Haze IPA', 'Backroads and Byways Honey Brown Ale', 'Lunchbox Porter', 'B.L.T.', 'Get Baked Peach Pie Gose', 'Beer Pop', 'The Fuzz Peach Rosemary Pale Ale', 'Cuke Story, Bro! Cucumber Saison', 'Roll with the Punches Baltic Porter', 'IPA Day', 'Sweatshirt', 'Notifications', 'THC Seltzer', 'Ice', 'Folded Arms Stout', 'I Can Sleep When I'm Dead Coffee Stout', 'Flex Rental Fee', '3 Bones', 'Mushroom Pairing', 'Special', 'Chili', 'Meat Sampler', 'You Wanted A Hit American IPA', 'Craft Chocolate & Beer Flight Pairing', 'Domestic', 'Fries', 'Rich Mahogany Scotch Ale', 'Beer Transfer', 'Blackened Blue', 'Wine Bottle', 'Sunday Sandwich Special', 'Charcuterie Board', 'Lost In The Sauce DIPA', 'Coozie', 'Pulled Pork or Chix Sand w/ Chips', 'Bacon', 'German Chocolate Cupcake', 'Food Tab Collen', 'Brighter Days Saison', 'Sunshine State of Mind Citrus Wheat', 'Mimosa', 'Burger', 'Ice Cream Float w/ Pint', 'BBQ', 'Pork Loin', 'Belgian Tripel', 'Grapefruit Coastin West Coast IPA', 'Pulled Chicken', 'Drowned in Sound DIPA', 'Sweet Tomato', 'Cheerzilla', 'More Grind Than Glamour Irish Stout', 'Pancakes', '3 Year Anniversary Ticket (food+beer)', 'Flight Single (4 oz.)', 'You're Killing Me Smalls Session IPA', 'Yerba Mate Can', 'Yerba Mate', 'Y'all & Oats Oatmeal Stout', 'Wunderhaus Marzenbier Lager', 'World Cup Special 60oz Pitcher‚ÄîFRIDAY ONLY', 'Works Every Time Peanut Butter Porter', 'Without A Doubt Smoked Scotch Ale', 'Wit Me Baby One More Time Sour Wheat 10 oz.', 'Winter Hat', 'Wholesale Merch', 'Whoa Nellie Vienna Lager', 'White Wine (Half Bottle)', 'When I Dip, You Dip, We Dip Pastry Porter', 'Wellington', 'Wedge Salad', 'We've Got Buns Hun Pastry Porter', 'Watermelon Wit', 'Water Bottle', 'Water', 'Walking In The Neon IPA', 'Vesna Cold IPA', 'Variety Q', 'Variety', 'Utensils', 'Used 2 B Cool Pale Ale', 'Upcharge', 'Underberg', 'Under the Stars Porter', 'Umbrella', 'Turkey Salad', 'Turkey Reuben', 'Turkey Chili', 'Turkey', 'Trucker Hat', 'Trout Dip', 'Triple IPA', 'Tried and True Honey Amber Ale', 'Trapple', 'Transfer', 'Tote Bag', 'Torte', 'Too Old for This Wit Belgian Wheat Ale', 'Too Old for This Wit', 'Tiny Little Something Table Saison', 'Time Capsule IPA', 'These Haze, They're Trying To Murder Me Hazy IPA', 'These Haze, They're Trying to Murder Me Hazy IPA', 'The Hustle is Bone Crushing IPA', 'Texas Toast', 'Test Product', 'Test Of Time American Stout', 'Tea', 'Tart Cherry Mule Draft Mocktail', 'Tank Top', 'Tank top', 'Tan Lines Porter', 'Take Me Back Funky IPA', 'Tacos', 'Sweet Vinegar Slaw', 'Sweet Stacks Decadent Porter', 'Sweet Potato', 'Sweater Weather Pumpkin Ale', 'Super Lit Spritz w / Devil's Foot Ginger Beer', 'Sunday Pint/PORK Sandwich', 'Summit Up Coffee Stout', 'Sugar Bacon', 'Sub Meat', 'Sub Cornbread', 'Sub Chips', 'Sub', 'Sticker', 'Stay Golden Light Lager', 'State Farm Tab', 'Staff 4 Pack', 'St. Pattys Day', 'Sport Mode Blonde Ale', 'Spicy Vinegar', 'Spicy Ranch', 'Spicy Chicken', 'Spicy Brisket', 'Spicy Beef', 'Spicey Ranch', 'Spicey Chicken', 'Special Sandwich', 'Special Sando', 'Special Plate', 'Special BBQ', 'Sparkling Superfruit Tea Blackberry Hibiscus', 'Sparkling Riesling', 'Sparkling Labrusca', 'Spareribs', 'Southside Sauce Triple IPA', 'South Slope Cheese Spread', 'South Slope Charcuterie Box', 'Soup and Sandwich', 'Soup', 'Sorry for the Late Reply IPA', 'Soft Pretzel', 'Soda', 'So It Gose', 'Snickerdoodle Do Imperial Stout', 'Smokehouse Saison', 'Smoked Turkey', 'Smoked Tomato Vinaigrette', 'Smoked Potato Salad', 'Smoked Peach Pale', 'Smkd Chicken Sand', 'Smarty Pints Helles', 'Small Batch Saturday', 'Slingshot Nitro Flash Brew', 'Slingshot Coffee Citrus Vanilla Cream Soda', 'Sliders', 'Sliced Brisket', 'Slammie', 'Skeleton Crew Cold IPA', 'Sirloin', 'Silent Holler IPA', 'Sides', 'Shrimp Roll', 'Shrimp and Grits', 'Short Rib', 'Shady Behavior Hazy Pale Ale', 'Service Package', 'Secret Third Thing West Coast Pilsner', 'Second Hand Store Raspberry Wheat', 'Second Hand Store Peach Wheat', 'Second Hand Store Fruited Wheat', 'Sausage Plate', 'Sauce', 'Sandwich and Beer', 'Sandwich', 'Salad', 'Saison Is The New Bitcoin', 'Saison Crowler', 'Saison', 'Rye Think You Should Leave Porter', 'Ruff Rye-Der Rye IPA', 'Rose 2.0 (Half Bottle)', 'Rose', 'Rosa Tinted Glasses', 'Root Cause Sweet Potato Stout', 'Root Beer', 'Roll', 'Rockford Peach Hazy IPA', 'Roast Beef', 'Rib Club', 'Rib', 'Reuben', 'Remember When... Festbier', 'Rehearsal Dinner', 'Regular', 'Redwood Red Wine', 'Red Wine (Half Bottle)', 'RC Cola', 'Random Musings Blood Orange IPA', 'Raised by Wolves Imperial Stout', 'Rad Rad City Zested Lager', 'Rad City Radler', 'Rack Ribs w/o Sides', 'Rack Ribs w/ 2 Sides', 'Rachel', 'Purple Salad', 'Puns 'n Roses Floral Hefeweizen', 'Punks & Poets Imperial Stout w / Cherry + Coconut', 'Pulled Sandwich Special', 'Pulled Pork or Chix Sand w / 2 Sides', 'Pulled Pork', 'Pulled Chicken Sand', 'Pudding', 'Proper Pilz Pilsner', 'ProComm', 'Processing Fee', 'Pretzel', 'Practicing Human Dry Hopped Sour', 'PPSand / chips Special', 'Pouches', 'Potato Chips', 'Pot Pie', 'Portobello', 'Porkloaf', 'Pork - Egg - Cheese', 'Pork Wing', 'Pork Special', 'Pork Rinds', 'Pork Nuggz', 'Pork Nuggs', 'Pork Chop', 'Pork Belly', 'Pork', 'por', 'Poppy Flight', 'Poetic Noble Land Mermaid', 'Po Boy', 'Pitcher', 'Pinky Promise Sour Farmhouse Ale', 'Pink Strides Sour', 'Pink Strides Gose', 'Pink Graffiti Gose', 'Pineapple Habanero', 'Pillow Talk Is Dead Tangerine Pale Ale', 'PieZaa Slice Only', 'PieZaa Slice and Pint', 'Pickles', 'Philly', 'Pesto Mayo', 'Permanent Vacation West Coast IPA', 'Pepper Jack', 'Pay Balance', 'Pastrami', 'Parallel Lines Blonde Ale', 'Pale Ale', 'Packaging Fee', 'Organic Juice Box', 'Orange Crush', 'Open Item', 'Open Food', 'Open', 'Onions', 'Onion Strings', 'Onion Rings', 'On The Tracks Espresso Stout', 'Old School Hip Hop Reference Lager', 'Oktoberfest Sampler Plate', 'Oatmeal Stout', 'oat lager(deleted)', 'Nuggz', 'Notebook', 'Not Safe For School Peanut Butter Porter', 'No Sauce', 'No F / N', 'Nightmowing Hefeweizen', 'Night to Rewind Pineapple IPA', 'Next of Kin IPA', 'New England IPA', 'New Drip Double IPA', 'Never Ending Hoppyness', 'Nachos', 'N / A Beer', 'Mustard Q', 'Mushrooms', 'Mountain Merch', 'Moseying Around Dark Mild Ale', 'Morsel Cookies', 'Morning Routine Stout', 'More Jam Less Band Berliner Weisse', 'Mood Ring Berliner Weisse', 'Momentary Bliss Saison', 'Mixtape Flashback Blueberry Wheat', 'Mixtape Flashback Blueberry Hefeweizen', 'Mixed Feelings Rustic Pilsner', 'Mix & Match 4 Pack', 'Misspent Youth IPA', 'Missing You Like Candy Pecan Porter', 'Misc', 'Michelada', 'Mic Drop New England IPA', 'Metal Brewery Sign', 'Melt', 'Meatloaf', 'Meatball Sub', 'Mass Appeal Latte Stout', 'Mashed Sweets', 'Marinated Brisky Sando', 'Marble and Steel Bar', 'Maple', 'Malt Vinegar', 'Macaron Flight Pairing', 'Macaron Flight', 'Mac and Cheese', 'Mac & Cheese', 'M.L.T.', 'Lyon In The Fog IPA', 'Low Key Lit Pineapple IPA', 'Love & Haight Pale Ale', 'Lost in Foundy Stout', 'Long Strange Trip Belgian Tripel', 'Long Shadow Traditional IPA', 'Logo Glass', 'Loaded Fries Pulled Pork', 'Loaded Fries Brisket', 'Loaded Fries', 'Living My Zest Life Belgian Wheat Ale', 'Little Brett Grisette', 'Lit Spritz Hard Seltzer w / Watermelon & Cucumber', 'Lit Spritz Hard Seltzer w / Tart Cherry', 'Lit Spritz Hard Seltzer w / Strawberry, Lime + Sea Salt', 'Lit Spritz Hard Seltzer w / Raspberry Sangria Hard Seltzer', 'Lit Spritz Hard Seltzer w / Pink Guava & Raspberry', 'Lit Spritz Hard Seltzer w / Lavender, Yuzu & Lemon', 'Lit Spritz Hard Seltzer w / Elderberry', 'Lights Out Stout', 'Life Of Leisure Kolsch', 'Lettuce', 'Lemonade', 'Lemon Bar', 'Late Bloomer IPA', 'Lamb', 'Lagerville Lager w / Key Lime & Salt', 'Kolsch Crowler', 'Kids These Days Hefeweizen', 'Kids Grilled Cheese', 'Keychain Bottle Opener', 'Keg Deposit Sixtel', 'Keg(Sixtel)', 'Keg(Half Barrel)', 'Keg', 'Kebab', 'Just for Kicks Watermelon & Lime Kolsch', 'Jumbo Soft Pretzel w / Chz & Mustard', 'Juice Box', 'Jerk BBQ', 'Jalapeno Grits', 'Isla De Hueso Dark Lager', 'Irish Red Ale(deleted)', 'Irish Goodbye Red Ale', 'IPA Flight', 'Into The Ether Porter', 'Into the Ether Porter', 'Infruition Sparkling Yerba Mate', 'Indoorsy Milk Stout', 'In the Mood Dark Sour', 'Imperial Crowler', 'Ice Cream', 'I'm A Pucker For Your Love Sour IPA', 'I See Stars Double Sour IPA 10 oz Pour', 'I Love You, But I've Chosen Saison', 'I Love That for You Helles Lager', 'House Saison', 'House Pilsner', 'Hot Jalapeno', 'Horseradish Sauce', 'Hop Shower Sour Imperial Sour w / Tangerine, Guava, Passion Fruit & Vanilla', 'Hop Shower Sour Imperial Sour w / Strawberry & Vanilla', 'Hop Shower Sour Imperial Sour w / Passionfruit, Pineapple & Strawberry', 'Hop Shower Sour Imperial Sour w / Blackberry, Mango, Strawberry', 'Hop Shower Sour Imperial Sour w / Blackberry, Blueberry & Vanilla', 'Hop Shower Sour Imperial Sour w / Blackberry, Blueberry & Raspberry', 'Hop Shower Sour Imperial Sour w / Apricot, Strawberry & Vanilla Bean', 'Hop Shower Sour Imperial Sour', 'Hop Girl Summer IPA', 'Hoodie', 'Honey', 'Holiday', 'Hole Lotta' Pumpkin', 'Hogzilla', 'Hi-Wire Zirkusfest Oktoberfest', 'Hemlock Sparkling White', 'Hellbilly Helles Lager', 'Heat Lamp IPA', 'Hawkeye Tailgate Amber', 'Hawaiian', 'Harvest Apple', 'Hard Seltzer', 'Handshakes & High-fives IPA', 'Half Pour', 'Half Jack', 'Half Chicken', 'Gyro', 'Gumbo', 'Gruner Veltliner', 'Ground (12pack Shipping)', 'Grits', 'Grilled Cheese', 'Green Salad w Turkey/Mush', 'Green Salad w Pork/Chix', 'Green Salad w CHBR', 'Green Salad w 4 Ribs', 'Green Salad', 'Green Beans', 'Gratuity', 'Got 'Em IPA', 'Good Trouble Amber Ale', 'Good Lad Irish Stout', 'Glass Wine', 'Give Them Flowers Oat Lager', 'Girls Pint Out', 'Gingers Revenge', 'Ginger's Revenge Bottle', 'Gimme Some Morsel Stout', 'Gift Certificate', 'Get Funky Wit It Sour Witbier', 'Get Baked Cherry Pie Gose', 'Future Legend Hazy IPA', 'Funk Around & Find Out', 'Full Disclosure Pale Ale', 'Fruit Cup', 'Fried Pickles', 'Fried Mushroom & Saison Pairing', 'Fried Green Tomatoes', 'Fresh Pressed Blood Orange IPA', 'Freight Hopper Hoppy Lager', 'Free Lunch & A/C Hazy IPA', 'Four Vices Coffee Chocolate Blonde', 'Fountain Soda', 'Food Only', 'Follow Your Dreamsicle Orange Vanilla Hazy', 'Foggzilla Double IPA', 'Flying Machine DIPA', 'Flowerweisse', 'Flow State New England IPA', 'Flight/Pretzel', 'Flight Tray w/ 4oz. Masons', 'Flight Tray', 'Flight', 'First Rodeo Helles', 'First Light Pale Lager', 'Feels Like Summer Prickly Pear IPA', 'Fatty', 'Fat Cap Porter', 'Farmhouse Du Blanc Saison/Wine Hybrid', 'Fancy Frootwork Sour Ale', 'Family Pack', 'Faded Flannel Brown Ale', 'Extra Items', 'Extra Cheese/Mustard', 'Eternal Return West Coast DIPA', 'Error', 'Endless Hopportunity Hazy Pale Ale', 'Employee of the Month Citrus Wheat Ale', 'Employee Crowler', 'Egg Rolls', 'Egg n Cheese', 'DSSOLVR Pineapple Margarita Gose', 'DSSOLVR - Blood for the Moon Marzen Lager', 'Dssolvr', 'Drowned In Sound DIPA', 'Draft', 'Dot's Homestyle Pretzels', 'Dog Treats', 'Dog Toy', 'Dog Bandana', 'Diet Rite', 'Diet Cheerwine', 'Devil's Foot Brew Craft Non-Alcoholic', 'Dessert', 'Deposit', 'Daydream Misfit Jamaican Lager', 'Czechs All The Boxes German Pilsner', 'Custom Amount', 'Curate Mediterranean Lager', 'Cups or Utensils', 'Cupcake', 'Cuke Salad', 'Cuban', 'Ctrl + Malt + Delete Amber Lager', 'Crowler', 'County Line Belgian Witbier', 'Country Store Cream Ale', 'Country Line Appalachian Witbier', 'Country Casual Dark Lager', 'Country Boil', 'Cosmic Whip: Citra IPA', 'Cosmic Sorbet Milkshake IPA w/ Strawberry & Blackberry', 'Corned Beef and Cabbage', 'Cornbread Mix', 'Corn Pudding Mix', 'Corn Pudding', 'Corn', 'Cookie', 'Cookbook', 'Coloring Outside the Lines Brown Ale', 'Collard Greens', 'Cold Frontal Cold IPA', 'Coffee Chocolate Blonde Ale', 'Coconut Porter', 'Cocomotive Coconut Stout', 'Cobbler', 'Cobb Salad w Turkey', 'Cobb Salad w Pork/Chix', 'Cobb Salad w 4 Ribs', 'Cobb Salad', 'Coastin' West Coast IPA', 'Coastal Grandmother Kolsch', 'Closing Check', 'Classy & Fabulous Coconut Porter', 'CIDER', 'Cider', 'Chow Chow', 'Chopped Brisket', 'Chocolate Bar', 'Chips', 'Chipotle Burger', 'Chill Factor Cold IPA', 'Chicken Wrap', 'Chicken Salad', 'Chicken Pot Pie', 'Chicken & Gravy Sammy', 'Chicken', 'Chicarrones', 'Cheesecake Bar', 'Cheese Sauce', 'Cheese', 'Cheerwine', 'Cheer Q', 'Cheeky Gander English Pub Ale', 'Cheddar Brat', 'Charcuterie & Pint', 'Cellarist', 'CBD Water', 'Cause for Alarm Double IPA', 'Caught in the Rain Pineapple Vanilla Hazy IPA', 'Catering Fee', 'Catering Equipment', 'Catering', 'Catawba Rose', 'Cash', 'Case Freight Hopper Hoppy Lager', 'Case', 'Carribean', 'Carolina Kettle Chips', 'Canned Soda', 'Can / Bottle Soft Drinks', 'Campfire Mug', 'Call it a Day Kolsch', 'Cake', 'Butt', 'Burrito', 'Burnt Ends', 'Burning Blush Brewery Euro - bender Oktoberfest Lager', 'Burning Blush', 'Buns or Cornbread', 'Buff Cauliflower', 'Brunswick Stew', 'Brownie', 'Brown Sugar', 'Brisket Melt', 'Brisket', 'Bringing Sexy Baklava Imperial Stout', 'Brie', 'Bread Pudding', 'Brat and Pretzel', 'Brat', 'Bourdain Beer', 'Bottled Water', 'Bottled Sauces', 'Bottle Water', 'Bottle Soda', 'Boozy Sparkling Water', 'Booty Schwarz Dark Lager', 'Boomer', 'Bonfires & Fireflies Dark Lager', 'Bonafide American Pale Ale', 'Blueberry Chipotle', 'BLT', 'Blondie', 'Blonde Voyage Belgian Ale', 'Biscotti From Above 2020 Pub Ale', 'Bingo Bango Mango Gose', 'Beer Pretzels', 'Beer Pitcher', 'Beer Mimosa', 'Beer Glass', 'Beer Dinner Ticket', 'Beer Cheese', 'Beer Boiled Peanuts', 'Beer and Bon Bon Pairing', 'Beer & Food Tour', 'Beef Brisket', 'Beef', 'Beanie', 'Beach, Please! Gose', 'BB Barns', 'Basket Vinegar Chips', 'Basket', 'Bananarama Blonde Ale', 'Bama Q', 'Baked Potato', 'Baked Beans', 'Bacon - Egg - Cheese', 'Bacon Sugar', 'Back To Basics Brown Ale', 'Baby Billy Bible Dunkel', 'Auto - Tune Mosaic IPA', 'Athletic Brewing N / A Beer', 'Asheville Poppy Popcorn', 'Art Market', 'Arroz Con Leche Blonde', 'Apple Turkey Sandwich', 'Apple Brown Ale', 'Anniversary Ticket(Food Only)', 'Anniversary Ticket(Beer)', 'Anniversary Picnic + Beer', 'Anniversary Glass', 'American IPA', 'All - Purpose', 'All Together IPA', 'All My Friends Saison', 'All Joy, No Division Pineapple Hazy IPA', 'All Disco No Panic Hazy IPA', 'After Party Pale Ale', 'Adjustment', 'Adjusting the Dream Golden Strong', 'A & W Root Beer', 'A La Carte Macarons', 'A Days Work Pale Ale', '7up', '5 % CC Fee', '5 Riverside Kolsch', '40 ppl', '4 Wings Plate', '4 oz', '4 Bon Bons', '30th Bday', '3 Year Anniversary Ticket(glass + beer)', '12 Galaxies IPA', '12 Bones Oktoberfest', '12 Bones Nachos', '12 Bones All Together IPA', '12 Bones', '06 Bones', '03 Bones', '02 Bones')


    Table: costs: This is the costs table that is directly imported from a food vendor. This is updated monthly. This mostly contains the ingredients that the brewery/restaurant makes to prepare the food/beverages. The important columns in this table are item_name that give the name of the item ordered, date for when the order was made and sales, weight/quantity for pricess.

      Schema:
      table_name    column_name data_type   meaning
        costs   date    date    date
        costs   manufacturer    text    manufacturer
        costs   item_name   text    index costs.item_name = costs_groups.item_name
        costs   pack    integer pack
        costs   size    text    size
        costs   brand   text    brand
        costs   unit_type   text    unit_type
        costs   quantity    integer quantity
        costs   weight  numeric weight
        costs   sales   numeric sales

    Table: costs_groups: The costs_groups table is a supporting table for costs and contains information on the item_name from costs, this item_name could actually have a lot of variations on the name, so we have this table to standardize the names to items, and item_group/item_type that could be used for categorization for anything that requires a groupby.

      Schema:
      table_name    column_name data_type   meaning
        costs_groups    item_name   text    index costs.item_name = costs_groups.item_name
        costs_groups    item    text    item
        costs_groups    item_type   text    item_type
        costs_groups    item_group  text    item_group
  
    
    The tables can be joined on relevant fields for cross-table analysis:
      - time_entries and item_selection_details can be joined on date fields for date-based analysis.
      - for now costs, time_entries and item_selection_details can only be joined on dates because we don't quite have a mapping from menu_item in item_selection_details table to item_name in costs table. 
      - item_selection_details and menu_mappings should be joined (item_selection_details.menu_item = menu_mappings.item_name) AND coalesce(isd.menu_group, 'Null') = coalesce(mm.menu_group, 'Null') to standardize menu items for accurate analytics.
      - costs and costs_groups should be joined on (costs.item_name = costs_groups.item_name). When there are any queries on costs, do a join with costs_groups and do groupbys after that so that the nomenclature is standard.



      Example standard query for menu item analysis using menu_mappings:

        SELECT mm.category, mm.product_name, sum(isd.qty) as total_quantity, SUM(isd.total_price) AS total_sales
    FROM item_selection_details isd 
    JOIN menu_mappings mm ON isd.menu_item = mm.menu_item and coalesce(isd.menu_group, 'Null') = coalesce(mm.menu_group, 'Null') 
    GROUP BY mm.category, mm.product_name 
    ORDER BY total_sales DESC
    
    This query transforms the adhoc menu_item names into standardized product_name values for accurate analysis.

    For time series analysis across tables (especially time_entries, costs, and item_selection_details):
      - First group by time periods (day, week, month) within each table
      - Then join the aggregated results on the common time periods
      - This approach is more efficient and produces cleaner results than joining raw tables
    
    Example of time series join with proper grouping:

    -- First query: Get monthly time entries data
    WITH monthly_time AS (
      SELECT 
        DATE_TRUNC('month', start_time) AS month,
        SUM(total_hours) AS total_hours,
        AVG(wage) AS avg_wage
      FROM time_entries
      GROUP BY DATE_TRUNC('month', start_time)
    ),
    -- Second: Get monthly sales data
    monthly_sales AS (
        SELECT 
          DATE_TRUNC('month', sent_date) AS month,
          SUM(total_price) AS total_sales
        FROM item_selection_details
        GROUP BY DATE_TRUNC('month', sent_date)
    )

    IMPORTANT: You have two options for generating queries:

    1. SINGLE QUERY WITH JOINS: If the user's request can be satisfied with a single query that uses JOIN operations, you may use that approach.

    2. MULTIPLE SEPARATE QUERIES: You are encouraged to generate multiple separate SQL queries when appropriate, especially when:
      - The user is asking for multiple distinct metrics or insights
      - Different parts of the analysis require different groupings or time periods
      - The data would be clearer if presented in separate result sets
      - Complex JOINs might make the query inefficient or the results harder to interpret

    Example 1

    user query: are we getting better or worse?

    generated sql:
    "
    SELECT
      DATE_TRUNC('month', order_date) AS month,
      SUM(net_price) AS total_sales,
      CASE 
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 'Current Month'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN 'Last Month'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months') THEN '2 Months Ago'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months') THEN '3 Months Ago'
        WHEN DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year') THEN 'Last Year Same Month'
      END AS period_label
    FROM item_selection_details
    WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
        AND order_date <= CURRENT_DATE
        
    GROUP BY DATE_TRUNC('month', order_date)
    HAVING DATE_TRUNC('month', order_date) IN (
        DATE_TRUNC('month', CURRENT_DATE),                    -- Current month
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), -- Last month
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'),-- 2 months ago
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'),-- 3 months ago
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')   -- Last year same month
    )
    ORDER BY month DESC;
    "

    Example 2:

    user query: what product category sells more than others?

    generated sql:
    "
    WITH monthly_special_sales AS (
      SELECT 
        mm.product_name,
        DATE_TRUNC('month', isd.order_date) AS sales_month,
        SUM(isd.qty) AS total_quantity,
        SUM(isd.net_price) AS total_sales
      FROM 
        item_selection_details isd
      JOIN 
        menu_mappings mm
        ON isd.menu_item = mm.menu_item
        AND COALESCE(isd.menu_group, 'Null') = COALESCE(mm.menu_group, 'Null')
      WHERE 
        mm.category in ('Special - Bowl', 'Special - Sandwich', 'Special - Plate')
      GROUP BY 
        mm.product_name,
        DATE_TRUNC('month', isd.order_date)
      HAVING 
        SUM(isd.net_price) > 0
    ),
    ranked_sales AS (
      SELECT 
        sales_month,
        product_name,
        total_quantity,
        total_sales,
        RANK() OVER (PARTITION BY sales_month ORDER BY total_sales DESC) AS sales_rank
      FROM 
        monthly_special_sales
    )
    SELECT
      sales_month,
      product_name,
      total_quantity,
      total_sales,
      sales_rank
    FROM
      ranked_sales
    WHERE
      sales_rank <= 10
    ORDER BY 
      sales_month ASC,
      total_sales DESC;
    "


    So when you are creating this sql query, first come up with a query plan -- here are the step-by-step instructions:
    1. First pick the right columns that could be relevant from each table.
    2. Then come up with join keys for these tables
    3. Then come up with table-wise subqueries that are needed (this could include group bys, aggregates, or window functions)
    4. Next put all this together.
    5. Only use dates after Jan 2021
    6. Revise the overall query and review/refactor as necessary.
    `
    });

    // Add previous conversation context if available
    if (context?.previousQueries) {
      // Add previous conversation messages in a concise format
      for (let i = 0; i < context.previousQueries.length; i += 2) {
        const userMessage = context.previousQueries[i];
        const systemResponse = context.previousQueries[i + 1];

        // Add user query
        if (userMessage && userMessage.type === "user") {
          messages.push({
            role: "user",
            content: userMessage.content,
          });
        }

        // Add system response (SQL queries and results if available)
        if (systemResponse && systemResponse.type === "system") {
          let responseContent = systemResponse.content;

          // If there's session data with SQL queries, add that information
          if (systemResponse.session) {
            const session = systemResponse.session;
            if (session.sqlQueries && session.sqlQueries.length > 0) {
              const sqlInfo = session.sqlQueries
                .map(
                  (sq: any) =>
                    `Query: ${sq.queryName} \nSQL: ${sq.sql.slice(0, 300)}${sq.sql.length > 300 ? "..." : ""} `,
                )
                .join("\n\n");

              // Add brief result summary if available
              let resultSummary = "";
              if (session.queryResults && session.queryResults.length > 0) {
                const firstResult = session.queryResults[0];
                if (firstResult.data && firstResult.data.length > 0) {
                  resultSummary = `\n\nResults: ${Math.min(firstResult.data.length, 100)} rows returned`;
                  // Add first row as example
                  if (firstResult.data[0]) {
                    resultSummary += `\nSample: ${JSON.stringify(firstResult.data[0]).slice(0, 200)} `;
                  }
                }
              }

              responseContent = `${sqlInfo}${resultSummary} `;
            }
          }

          messages.push({
            role: "assistant",
            content: responseContent,
          });
        }
      }
    }

    // Add current user query
    messages.push({
      role: "user",
      content: `Generate the SQL query or queries necessary to retrieve the data the user wants: ${query} `,
    });

    const result = await generateObject({
      model: openai("gpt-4o"),
      messages,
      schema: z.object({
        queries: z.array(
          z.object({
            queryName: z
              .string()
              .describe("A short name describing what this query calculates"),
            queryDescription: z
              .string()
              .describe(
                "A brief description of what this query does and what insights it provides",
              ),
            sql: z.string().describe("The SQL query to execute"),
          }),
        ),
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    const queries = data.queries; // Directly access the queries field

    return queries;
  } catch (error) {
    console.error("Error fetching queries:", error);
    throw error;
  }
}

export const runGenerateSQLQuery = async (
  queries: { queryName: string; queryDescription: string; sql: string }[],
) => {
  "use server";

  // Array to hold results from all queries
  const allResults: {
    queryName: string;
    queryDescription: string;
    data: any[];
  }[] = [];

  // Execute each query
  for (const query of queries) {
    // Check if the query is a SELECT statement
    const sqlQuery = query.sql;
    const sqlLower = sqlQuery.trim().toLowerCase();

    // Check if it starts with SELECT or WITH
    if (!sqlLower.startsWith("select") && !sqlLower.startsWith("with")) {
      throw new Error("Only SELECT and WITH queries are allowed");
    }

    // Check for disallowed SQL commands using word boundaries or spaces
    const disallowedCommands = [
      /\bdrop\b/,
      /\bdelete\b/,
      /\binsert\b/,
      /\bupdate\b/,
      /\balter\b/,
      /\btruncate\b/,
      /\bcreate\b/,
      /\bgrant\b/,
      /\brevoke\b/,
    ];

    if (disallowedCommands.some((pattern) => pattern.test(sqlLower))) {
      throw new Error("Only SELECT queries are allowed");
    }

    try {
      const data = await sql.query(sqlQuery);
      allResults.push({
        queryName: query.queryName,
        queryDescription: query.queryDescription,
        data: data.rows,
      });
    } catch (e: any) {
      if (e.message.includes('relation "unicorns" does not exist')) {
        console.log(
          "Table does not exist, creating and seeding it with dummy data now...",
        );
        // throw error
        throw Error("Table does not exist");
      } else {
        throw e;
      }
    }
  }

  return allResults;
};

export const explainQuery = async (
  input: string,
  queries: { queryName: string; queryDescription: string; sql: string }[],
) => {
  "use server";
  try {
    // Format queries for the prompt
    const queriesText = queries
      .map((q, i) => `Query ${i + 1} (${q.queryName}): \n${q.sql} `)
      .join("\n\n");

    const result = await generateObject({
      // model: luna("luna/model-1"),
      model: openai('gpt-4o'),
      schema: z.object({
        explanations: z.array(
          z.object({
            queryName: z.string(),
            sections: z.array(
              z.object({
                section: z.string(),
                explanation: z.string(),
              }),
            ),
            overallPurpose: z
              .string()
              .describe("A summary of what this query accomplishes"),
          }),
        ),
      }),
      system: `You are a SQL(postgres) expert.Your job is to explain to the user the SQL queries you wrote to retrieve the data they asked for.The database contains the following tables and schemas:

    Table: time_entries
      # column_name            data_type                           is_nullable
    1  id                    text                                NO(PRIMARY KEY)
    2  user_id               text                                NO
    3  project_id            text                                NO
    4  task_id               text                                YES
    5  start_time            timestamp without time zone         NO
    6  end_time              timestamp without time zone         NO
    7  duration              integer                             NO
    8  description           text                                YES
    9  billable              boolean                             YES
    10 created_at            timestamp without time zone         NO
    11 updated_at            timestamp without time zone         NO
    12 location              text                                YES
    13 location_code         text                                YES
    14 employee_id           text                                YES
    15 employee_external_id  text                                YES
    16 employee_name         text                                YES
    17 job_id                text                                YES
    18 job_code              text                                YES
    19 auto_clockout         boolean                             YES
    20 total_hours           numeric(10, 2)                       YES
    21 unpaid_break_time     numeric(10, 2)                       YES
    22 paid_break_time       numeric(10, 2)                       YES
    23 payable_hours         numeric(10, 2)                       YES
    24 cash_tips_declared    numeric(10, 2)                       YES
    25 non_cash_tips         numeric(10, 2)                       YES
    26 total_gratuity        numeric(10, 2)                       YES
    27 total_tips            numeric(10, 2)                       YES
    28 tips_withheld         numeric(10, 2)                       YES
    29 wage                  numeric(10, 2)                       YES
    30 regular_hours         numeric(10, 2)                       YES
    31 overtime_hours        numeric(10, 2)                       YES
    32 regular_pay           numeric(10, 2)                       YES
    33 overtime_pay          numeric(10, 2)                       YES
    34 total_pay             numeric(10, 2)                       YES

    Table: item_selection_details
      # column_name            data_type                           is_nullable
    1  id                    text                                NO(PRIMARY KEY)
    2  selection_id          text                                NO
    3  item_id               text                                NO
    4  quantity              numeric(10, 2)                       NO
    5  unit_price            numeric(10, 2)                       NO
    6  total_price           numeric(10, 2)                       NO
    7  notes                 text                                YES
    8  created_at            timestamp without time zone         NO
    9  updated_at            timestamp without time zone         NO
    10 location              text                                YES
    11 order_number          text                                YES
    12 sent_date             timestamp without time zone         YES
    13 check_id              text                                YES
    14 server                text                                YES
    15 table_name            text                                YES
    16 dining_area           text                                YES
    17 service               text                                YES
    18 dining_option         text                                YES
    19 master_id             text                                YES
    20 sku                   text                                YES
    21 plu                   text                                YES
    22 menu_item             text                                YES
    23 menu_subgroups        text                                YES
    24 menu_group            text                                YES
    25 menu                  text                                YES
    26 sales_category        text                                YES
    27 discount              numeric(10, 2)                       YES
    28 tax                   numeric(10, 2)                       YES
    29 is_void               boolean                             YES
    30 is_deferred           boolean                             YES
    31 is_tax_exempt         boolean                             YES
    32 tax_inclusion_option  text                                YES
    33 dining_option_tax     text                                YES
    34 tab_name              text                                YES

    Table: food_costs
      # column_name            data_type                           is_nullable
    1  id                    text                                NO(PRIMARY KEY)
    2  month                 timestamp without time zone         YES
    3  dist_sku              text                                YES
    4  mfr_sku               text                                YES
    5  manufacturer          text                                YES
    6  item_name             text                                NO
    7  pack                  text                                YES
    8  size                  text                                YES
    9  brand                 text                                YES
    10 unit_type             text                                YES
    11 quantity              numeric(10, 2)                       YES
    12 weight                numeric(10, 2)                       YES
    13 sales                 numeric(10, 2)                       YES
    14 created_at            timestamp without time zone         NO
    15 updated_at            timestamp without time zone         NO

    Table: menu_mappings
      # column_name            data_type                           is_nullable
    1  id                    text                                NO(PRIMARY KEY)
    2  index                 text                                YES
    3  item_name             text                                NO
    4  menu_group            text                                YES
    5  business_line         text                                YES
    6  category              text                                YES
    7  ounces                numeric(10, 2)                       YES
    8  product_name          text                                YES
    9  product_type          text                                YES
    10 package_amount        text                                YES
    11 created_at            timestamp without time zone         NO
    12 updated_at            timestamp without time zone         NO

    When you explain you must take a section of the query, and then explain it.Each "section" should be unique.So in a query like: "SELECT * FROM time_entries limit 20", the sections could be "SELECT *", "FROM time_entries", "LIMIT 20".

    The time_entries table contains information about employee work shifts, including the employee details, hours worked, wages, and tips.
    The item_selection_details table contains information about food / beverage orders, their prices, and details about the dining experience.
    The food_costs table contains information about food inventory costs, including product details, pricing, and inventory information.
    The menu_mappings table provides standardized mappings between the adhoc menu item names in item_selection_details.menu_item and standardized product names, essential for accurate analytics.

    Example standard query for menu item analysis using menu_mappings:

      SELECT mp.product_name, SUM(isd.total_price) AS total_sales
    FROM item_selection_details isd 
    JOIN menu_mappings mp ON isd.menu_item = mp.item_name 
    GROUP BY mp.product_name 
    ORDER BY total_sales DESC
    
    This query transforms the adhoc menu_item names into standardized product_name values for accurate analysis.
    
    For time series analysis across tables(especially time_entries, food_costs, and item_selection_details):
    - First group by time periods(day, week, month) within each table
      - Then join the aggregated results on the common time periods
        - This approach is more efficient and produces cleaner results than joining raw tables
          - Use functions like DATE_TRUNC('month', timestamp_column) for consistent grouping

    When explaining JOIN operations, be clear about why the joins were necessary based on the user's query - explain how the tables are related in the context of the query and what business question required pulling data from multiple tables. Make sure to explain join conditions in a way that's accessible to non - technical users.
    
    For multiple queries, explain each query separately and also explain how the queries work together to provide the overall insights the user requested.If queries retrieve data from different tables or combine data from multiple tables, explain why this approach was chosen and how it helps answer the user's question.

    For multiple tables(like time_entries, item_selection_details, and costs), emphasize how they relate to each other.For example:
    - How labor patterns affect sales performance
      - How inventory costs correlate with menu item popularity
        - How staffing levels impact customer experience metrics
    
    In your crossQueryInsights section, focus specifically on insights that require data from multiple queries to discover.
    `,
      prompt: `Explain the SQL queries you generated to retrieve the data the user wanted.Assume the user is not an expert in SQL.Break down each query into steps.Be concise.

      User Query:
      ${input}

      Generated SQL Queries:
      ${queriesText} `,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to explain query");
  }
};

export const generateChartConfig = async (
  queryResults: { queryName: string; queryDescription: string; data: any[] }[],
  userQuery: string,
) => {
  "use server";
  try {
    // Format the query results for the prompt
    const formattedResults = queryResults
      .map((qr, i) => {
        const sampleData = qr.data.slice(0, 5); // Take first 5 rows as sample
        return `Query ${i + 1} (${qr.queryName}): ${qr.queryDescription} \nSample data(${qr.data.length} total rows): \n${JSON.stringify(sampleData, null, 2)} `;
      })
      .join("\n\n");

    const result = await generateObject({
      // model: luna('luna/chat-model'),
      model: openai('gpt-4o'),
      schema: configSchema,
      system: `You are a data visualization expert.Your job is to help users create charts that best represent their data.
      First, you need to suggest the most suitable chart type(s) for visualizing the data returned by the SQL queries.
        Then, provide a complete configuration for the chart.

      The data comes from a restaurant management system with these main tables:
    - time_entries: Contains employee work shift data, hours, wages, and tips
      - item_selection_details: Contains food / beverage orders, prices, and dining details
        - food_costs: Contains inventory costs, product details, and sales information
          - menu_mappings: Contains standardized mappings between adhoc menu item names and consistent product names


      For time series analysis across tables(especially time_entries, food_costs, and item_selection_details):
    - First group by time periods(day, week, month) within each table
      - Then join the aggregated results on the common time periods
        - This approach is more efficient and produces cleaner visualizations than joining raw tables
          - Example: GROUP BY DATE_TRUNC('month', timestamp_column)

      Chart Options:
    - 'line' - Line Chart(good for time series or continuous data)
    - 'bar' - Bar Chart(good for comparing categorical data)
      - 'pie' - Pie Chart(good for showing proportions of a whole)
    - 'scatter' - Scatter Plot(good for showing correlation between two variables)
    - 'area' - Area Chart(good for showing cumulative totals over time)
    - 'table' - Table(when data is better shown as a table than a chart)
      
      DATA FORMATTING REQUIREMENTS:
    1. TIME SERIES: For any data with dates or times, ALWAYS ensure the data is sorted chronologically FROM OLDER TO NEWER dates(oldest first, most recent last).
         - Time must ALWAYS move forward in charts - data points should be in strict chronological order.
         - If data for certain time periods is missing, SKIP those periods rather than breaking chronological order.
         - Time labels MUST include BOTH month and year(e.g., "Jan 2023", "Feb 2023") for clear time reference.
         - Never abbreviate years or use ambiguous date formats.
      2. MONETARY VALUES: For any costs, revenue, sales, or other monetary amounts, make sure the chart labels include dollar signs($).
      3. NUMBER FORMATTING: All numeric values should be properly formatted with commas for thousands(e.g., $1, 234.56 instead of $1234.56).

      IMPORTANT - CONSOLIDATED VIEWS:
      When there are multiple queries, PREFER creating a consolidated view that combines data from all queries into a single chart, table and summary.
      1. Use the 'isConsolidated' field and set it to true to indicate this is a consolidated view
    2. In the 'consolidation' object, provide details about how the data should be combined:
    - 'method': How to combine data('merge', 'stack', 'join')
      - 'keyField': Common field to join on, if applicable
        - 'valueFields': Which fields contain the values to be consolidated
          - 'labelFields': ** REQUIRED ** - A mapping of original field names to display labels(e.g., { "total_revenue": "Total Revenue ($)", "employee_cost": "Employee Cost ($)" })
            - 'sourceQueries': Names of the queries being consolidated
    3. Create clear labels and color coding to distinguish data from different queries
    4. Provide a clear explanation of what the consolidated view shows in the description

    CRITICAL: The 'labelFields' property in the consolidation object is REQUIRED and must be a non - empty object that maps 
      field names from the source data to their human - readable display labels.Include ALL value fields and any other important 
      fields that will be displayed in the chart or table.
      
      ADDITIONAL CHART REQUIREMENTS:
    1. For time - based charts(especially line and area charts), data MUST be arranged FROM OLDER TO NEWER dates(oldest first, most recent last).
         - Missing time periods should be SKIPPED while maintaining the forward progression of time.
         - Time must ALWAYS move forward - never display dates out of chronological order.
         - ALWAYS include BOTH month and year in axis labels and tooltips for time data(e.g., "Jan 2023", "Feb 2023").
         - For more granular time data, include day, month, and year(e.g., "15 Jan 2023").
      2. For monetary values, include dollar signs($) in axis labels and legends.
      3. For any field that represents money(costs, sales, revenue, etc.), include "($)" in the label name.
      4. Use descriptive axis labels that clearly indicate what the data represents.
      
      For multiple query results that CANNOT be consolidated, you can suggest:
    1. Multiple charts(one per query) with clear explanations of what each shows
    2. A dashboard layout with multiple visualizations
      
      If the data combines information from multiple tables(through JOINs or as separate queries), ensure your chart configuration highlights these relationships effectively.Consider how cost data, sales data, and employee data can be visually correlated when appropriate.
      
      Provide clear titles, axis labels, and legends for all chart configurations.
      `,
      prompt: `Create a chart configuration that best represents the data returned by these SQL queries.

      User Query: ${userQuery}

      Query Results:
      ${formattedResults}

      When there are multiple queries, STRONGLY PREFER creating a consolidated view that combines all the data into a single comprehensive visualization rather than separate charts.Provide a complete chart configuration for this data.

      REMEMBER:
      1. If you create a consolidated view(isConsolidated: true), you MUST include the 'labelFields' object in the consolidation configuration that maps field names to human - readable labels.
      2. For time series data, ensure the data is sorted chronologically FROM OLDER TO NEWER dates(oldest first, most recent last).
      3. Time must ALWAYS move forward - if data is missing for certain periods, SKIP those periods rather than breaking chronological order.
      4. All time labels MUST include BOTH month and year(e.g., "Jan 2023") for clarity.please refrain from using timestamps and make the chart as human readable as possible.
    5. For monetary values(costs, revenue, sales), include dollar signs($) in labels and format numbers with commas for thousands.
      6. Make sure all monetary field labels include "($)" to indicate they represent dollar amounts.`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate chart configuration");
  }
};

export const generateDataInsights = async (
  queryResults: { queryName: string; queryDescription: string; data: any[] }[],
  userQuery: string,
) => {
  "use server";
  try {
    // Format the query results for the prompt
    const formattedResults = queryResults
      .map((qr, i) => {
        const sampleData = qr.data.slice(0, 5); // Take first 5 rows as sample
        return `Query ${i + 1} (${qr.queryName}): ${qr.queryDescription} \nSample data(${qr.data.length} total rows): \n${JSON.stringify(sampleData, null, 2)} `;
      })
      .join("\n\n");

    // Define schema for insights
    const insightsSchema = z.object({
      summary: z
        .string()
        .describe("A concise 1-2 sentence summary of the data"),
      keyFindings: z
        .array(
          z.object({
            title: z.string().describe("A brief title for the insight"),
            description: z
              .string()
              .describe("A detailed explanation of the insight"),
            importance: z
              .enum(["high", "medium", "low"])
              .describe("The relative importance of this insight"),
          }),
        )
        .describe("Key findings and patterns in the data"),
      recommendedActions: z
        .array(z.string())
        .describe("Suggested actions based on the data insights"),
      anomalies: z
        .array(
          z.object({
            description: z
              .string()
              .describe("Description of the anomaly or unusual pattern"),
            possibleExplanations: z
              .array(z.string())
              .describe("Possible explanations for this anomaly"),
          }),
        )
        .optional()
        .describe("Any anomalies or unusual patterns in the data"),
      correlations: z
        .array(
          z.object({
            variables: z
              .array(z.string())
              .describe("The variables that show correlation"),
            relationship: z
              .string()
              .describe(
                "Description of the relationship between these variables",
              ),
            strength: z
              .enum(["strong", "moderate", "weak"])
              .describe("The strength of the correlation"),
          }),
        )
        .optional()
        .describe(
          "Notable correlations between different variables in the data",
        ),
      trends: z
        .array(
          z.object({
            variable: z.string().describe("The variable showing a trend"),
            description: z.string().describe("Description of the trend"),
            direction: z
              .enum(["increasing", "decreasing", "fluctuating", "stable"])
              .describe("The direction of the trend"),
          }),
        )
        .optional()
        .describe("Identified trends in the data over time or categories"),
      crossQueryInsights: z
        .array(
          z.object({
            title: z
              .string()
              .describe("A brief title for the cross-query insight"),
            description: z
              .string()
              .describe(
                "A detailed explanation of how the different data sources relate to each other",
              ),
            relevance: z
              .enum(["primary", "secondary"])
              .describe("Whether this is a primary or secondary insight"),
          }),
        )
        .optional()
        .describe(
          "Insights that specifically connect or combine data from multiple queries",
        ),
    });

    const result = await generateObject({
      // model: luna('luna/model-1'),
      model: openai('gpt-4o'),
      schema: insightsSchema,
      system: `You are a data analyst and business intelligence expert for a restaurant business.Your job is to analyze SQL query results and provide meaningful insights, patterns, and recommendations based on the data.
      
      The data comes from a restaurant management system with these main tables:
    - time_entries: Contains employee work shift data, hours, wages, and tips
      - item_selection_details: Contains food / beverage orders, prices, and dining details
        - food_costs: Contains inventory costs, product details, pricing, and inventory information
          - menu_mappings: Contains standardized mappings between adhoc menu item names and consistent product names
      
      For menu item analytics, the standard approach is to join item_selection_details with menu_mappings:
      
      SELECT mp.product_name, SUM(isd.total_price) AS total_sales
      FROM item_selection_details isd 
      JOIN menu_mappings mp ON isd.menu_item = mp.item_name 
      GROUP BY mp.product_name 
      ORDER BY total_sales DESC
      
      This allows for standardized product analysis rather than working with inconsistent menu_item values.
      
      For time series analysis across tables(especially time_entries, food_costs, and item_selection_details):
    - First group by time periods(day, week, month) within each table
      - Then join the aggregated results on the common time periods
        - This approach reveals clearer trends and patterns than analyzing raw joined data
      
      Provide a comprehensive analysis that includes:
    1. A concise summary of what the data shows
    2. Key findings and their business implications
    3. Recommended actions based on these findings
    4. Any anomalies or unusual patterns
    5. Notable correlations between different variables
    6. Trends identified in the data
    7. Cross - query insights that connect data from multiple sources
      
      Focus on actionable insights that would be valuable to a restaurant business.Some important business areas to consider include:
    - Labor costs and efficiency
      - Food costs and inventory management
        - Sales performance and menu item popularity
          - Profitability analysis(comparing costs to sales)
            - Operational efficiency
      
      Be specific and reference actual values from the data when possible.Avoid vague generalizations.
      
      MULTIPLE QUERY ANALYSIS:
      When analyzing multiple query results, focus on:
    1. Analyzing individual datasets for their specific insights
      2. Creating CROSS - QUERY INSIGHTS that connect data across different tables
    3. Looking for cause - and - effect relationships between different metrics
    4. Identifying how employee data, sales data, and cost data interact with each other
    5. Finding holistic business patterns that would not be visible in any single query alone
      
      For multiple tables(like time_entries, item_selection_details, and costs), emphasize how they relate to each other.For example:
    - How labor patterns affect sales performance
      - How inventory costs correlate with menu item popularity
        - How staffing levels impact customer experience metrics
      
      In your crossQueryInsights section, focus specifically on insights that require data from multiple queries to discover.
      `,
      prompt: `Analyze the following SQL query results and provide meaningful insights, patterns, and recommendations for this restaurant business.

      User Query: ${userQuery}

      Query Results:
      ${formattedResults}

      Provide a detailed analysis with actionable insights, including cross - query connections where multiple data sources are present.`,
    });

    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate data insights");
  }
};

// Re-export types for the client
export type { Config };
