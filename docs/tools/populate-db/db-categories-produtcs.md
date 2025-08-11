
# **Foundational Line Item Database for LawnQuote Software**

This document provides a comprehensive and structured database of services and materials common to the landscaping and lawn care industry. It is designed to serve as the foundational dataset for the LawnQuote Software application. The hierarchical structure is intentionally organized to mirror the typical workflow of a landscaping professional, from initial client consultation and design to the specific labor activities and material selections required for project execution. This logical flow ensures that the end software will be intuitive for its target users—solo operators and small businesses. A core principle reflected throughout this database is the necessity for flexibility in units of measure; a single service may be quoted in multiple ways depending on the job's context, and a versatile quoting tool must accommodate this reality.1

## **I. Services Database**

This section outlines all billable labor, activities, and professional services. The categories progress from high-level planning and recurring maintenance to the granular tasks that constitute larger installation and construction projects.

### **Consultation & Design Services**

The initial phase of many landscaping projects involves planning, assessment, and design. These services represent the intellectual property of the contractor and are often billed at a premium compared to physical labor. Offering a tiered menu of design services allows a business to cater to different client needs and project complexities, establishing the contractor's expertise from the outset.

* **Item Name:** Initial Site Consultation  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour or Flat Fee  
* **Notes:** This is the first client meeting to assess the property, discuss scope, and establish a budget. It is a critical first billable item, often charged as a flat fee ranging from $100 to $300 that may be credited back if the client proceeds with a larger project.3  
* **Item Name:** Landscape Design Plan \- 2D Conceptual  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Project  
* **Notes:** A standard top-down schematic showing the layout of hardscapes, garden beds, and major plant placements. This is a common entry-level design deliverable.  
* **Item Name:** Landscape Design Plan \- 3D Rendering  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Project  
* **Notes:** A premium service providing a realistic, three-dimensional visualization of the proposed landscape. This service commands a higher price and often involves extra hourly fees for revisions.3  
* **Item Name:** Planting Plan / Softscape Design  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Hour  
* **Notes:** A specialized design focusing exclusively on plant selection, placement, quantities, and scheduling.  
* **Item Name:** Hardscape Design  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Hour  
* **Notes:** A technical design for patios, walkways, retaining walls, and other non-living elements, often including material specifications and construction details.  
* **Item Name:** Irrigation System Design  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Hour  
* **Notes:** A technical plan detailing zone layouts, head placement, pipe runs, and hydraulic calculations.  
* **Item Name:** Landscape Lighting Design  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Hour  
* **Notes:** A plan showing fixture selection, placement, wiring runs, and transformer sizing to achieve specific aesthetic and safety effects.  
* **Item Name:** Project Management / Contractor Coordination  
* **Category:** Consultation & Design  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour or Percentage of Project Cost  
* **Notes:** Billable time for overseeing project execution, managing timelines, and coordinating with subcontractors like electricians or plumbers. This is essential for large, multi-faceted projects.5

The pricing structure for design services reflects the maturity and capabilities of a landscaping business. A new operator might only offer an initial consultation, while a growing firm can add 2D and 3D design plans as flat-fee services to help sell larger installation jobs. Established design-build firms often use a percentage-of-project model (typically 10% to 20%) for comprehensive projects where design and installation are fully integrated.3 The software should allow the user to select the most appropriate billing method for these distinct service levels.

| Service Item | Common Pricing Model | Typical Range | Notes |
| :---- | :---- | :---- | :---- |
| Initial Site Consultation | Flat Fee or Hourly | $100 \- $300 | Often credited towards project cost if hired.3 |
| 2D Conceptual Plan | Flat Fee | $300 \- $3,000 | Varies greatly with project size and complexity.3 |
| 3D Rendering | Flat Fee (Add-on) | $500 \- $2,000+ | Often an addition to a 2D plan; hourly for revisions. |
| Project Management | Hourly or Percentage | $50 \- $150/hr or 10-20% | Percentage model is best for large, integrated design-build jobs.3 |

### **Lawn Maintenance**

This category represents the core recurring revenue stream for many lawn care businesses. Services are typically delivered on a contractual basis (e.g., weekly, bi-weekly) or as one-off jobs. The ability to quote these services using various units of measure is critical for adapting to different property types and client needs.

#### **Mowing & Edging**

* **Item Name:** Lawn Mowing \- Standard  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Mowing & Edging  
* **Common Unit of Measure:** per Visit, per Hour, per Sq. Ft., or per Acre  
* **Notes:** For typical residential lawns using push or walk-behind mowers. A flat "per Visit" fee is common for standard lots on a recurring schedule, while hourly or area-based pricing is better for non-standard properties.1  
* **Item Name:** Lawn Mowing \- Large Area  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Mowing & Edging  
* **Common Unit of Measure:** per Acre or per Hour  
* **Notes:** For large residential or commercial properties requiring a riding mower. The per-acre rate often decreases as the total acreage increases.1  
* **Item Name:** Lawn Edging \- Hard Surfaces  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Mowing & Edging  
* **Common Unit of Measure:** per Linear Ft.  
* **Notes:** Creating a clean edge along concrete or asphalt walkways, curbs, and driveways. Often included in a premium mowing service but can be itemized.  
* **Item Name:** Line Trimming (Weed Eating)  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Mowing & Edging  
* **Common Unit of Measure:** Included in Mowing or per Hour  
* **Notes:** Trimming grass around obstacles, trees, and along fence lines. Typically part of the standard mowing charge but can be billed hourly for overgrown or complex properties.  
* **Item Name:** Grass Clipping Bagging & Haul-Away  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Mowing & Edging  
* **Common Unit of Measure:** per Visit or per Bag  
* **Notes:** An optional add-on service. Most modern practices encourage mulching clippings back into the lawn to return nutrients, but some clients prefer them removed.7

#### **Turf Health & Renovation**

* **Item Name:** Core Aeration  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Turf Health & Renovation  
* **Common Unit of Measure:** per Sq. Ft. or per 1,000 Sq. Ft.  
* **Notes:** A key seasonal service to alleviate soil compaction. Pricing is almost always area-based, often with tiered rates that decrease for larger lawns.1  
* **Item Name:** Liquid Aeration  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Turf Health & Renovation  
* **Common Unit of Measure:** per Sq. Ft. or per Application  
* **Notes:** A chemical application that loosens soil. An alternative to mechanical core aeration.  
* **Item Name:** Dethatching / Power Raking  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Turf Health & Renovation  
* **Common Unit of Measure:** per Sq. Ft. or per Hour  
* **Notes:** Mechanical removal of the thatch layer from the lawn surface. Labor-intensive and often priced by area.  
* **Item Name:** Overseeding  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Turf Health & Renovation  
* **Common Unit of Measure:** per Sq. Ft. or per Lb. of Seed  
* **Notes:** Spreading grass seed over an existing lawn to improve density. Often performed in conjunction with core aeration.  
* **Item Name:** Slice Seeding / Power Seeding  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Turf Health & Renovation  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** A more intensive seeding method that uses a machine to cut grooves into the soil for better seed-to-soil contact, resulting in higher germination rates.1  
* **Item Name:** Top Dressing Application  
* **Category:** Lawn Maintenance  
* **Sub-Category:** Turf Health & Renovation  
* **Common Unit of Measure:** per Cubic Yard or per Sq. Ft.  
* **Notes:** Applying a thin layer of compost or specialized soil mix to the lawn surface to improve soil quality.

### **Garden & Bed Maintenance**

These services focus on the detailed, often manual, upkeep of planting beds and landscaped areas. The variability of this work means that pricing models must be chosen carefully to ensure profitability.

* **Item Name:** Garden Bed Weeding  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour  
* **Notes:** The time required for weeding is highly dependent on the density and type of weeds, making hourly billing the most common and safest method for the contractor.10  
* **Item Name:** Flower Deadheading / Perennial Care  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour  
* **Notes:** Removing spent blooms from annuals and perennials to encourage further flowering and maintain a tidy appearance.  
* **Item Name:** Perennial Cut-Back  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour or per Plant  
* **Notes:** A seasonal task, typically done in late fall or early spring, to cut back herbaceous perennials.  
* **Item Name:** Mulch Installation / Spreading  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Cubic Yard  
* **Notes:** This price typically includes the labor to spread the mulch. The labor is predictable enough that it can be built into the per-unit material cost, simplifying the quote.12  
* **Item Name:** Mulch Cultivation / Turning  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour or per Sq. Ft.  
* **Notes:** Raking and turning existing mulch to refresh its appearance and break up compaction.  
* **Item Name:** Bed Edging \- Natural Edge Definition  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Linear Ft.  
* **Notes:** Using a spade or bed edger to create a clean, defined trench between a garden bed and the lawn.  
* **Item Name:** Soil Amendment Installation  
* **Category:** Garden & Bed Maintenance  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Cubic Yard  
* **Notes:** Incorporating compost or other soil conditioners into garden beds. Similar to mulch, this is often quoted per cubic yard installed.

### **Fertilization & Treatments**

This category includes agronomic services that often require specialized knowledge and, in the case of certain chemicals, state licensing. These services are ideal for building recurring revenue through annual programs.

#### **Fertilizer Applications**

* **Item Name:** Granular Fertilizer Application (Slow-Release)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Fertilizer Applications  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** The standard for seasonal lawn feeding programs. Pricing is typically based on the area to be treated.14  
* **Item Name:** Liquid Fertilizer Application (Quick-Release)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Fertilizer Applications  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Used for rapid green-up or to correct specific nutrient deficiencies.  
* **Item Name:** Organic Fertilizer Application  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Fertilizer Applications  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Utilizes natural-source products. Often priced at a premium compared to synthetic options.15  
* **Item Name:** Tree & Shrub Deep Root Fertilization  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Fertilizer Applications  
* **Common Unit of Measure:** per Tree/Shrub or per Gallon of Mix  
* **Notes:** Specialized service involving injecting liquid fertilizer into the root zone of trees and shrubs.  
* **Item Name:** Soil pH Adjustment (Lime/Sulfur Application)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Fertilizer Applications  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Application of pelletized lime or sulfur to raise or lower soil pH based on soil test results.14

#### **Weed Control**

* **Item Name:** Pre-Emergent Herbicide Application  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Weed Control  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** A critical spring and sometimes fall application to prevent crabgrass and other weeds from germinating.18  
* **Item Name:** Post-Emergent Herbicide Application (Broadleaf)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Weed Control  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Targets existing broadleaf weeds like dandelions, clover, and plantain.20  
* **Item Name:** Post-Emergent Herbicide Application (Grassy Weeds)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Weed Control  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Specialized treatment for difficult-to-control grassy weeds.  
* **Item Name:** Non-Selective Herbicide Application  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Weed Control  
* **Common Unit of Measure:** per Hour or per Gallon of Mix  
* **Notes:** Kills all vegetation. Used to clear overgrown areas or prepare sites for new hardscapes or plantings.19

#### **Pest & Disease Control**

* **Item Name:** Lawn Insect Control (Grubs, Chinch Bugs)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Pest & Disease Control  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Can be preventative (for grubs) or curative. A common add-on to annual programs.14  
* **Item Name:** Mosquito & Tick Control Application  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Pest & Disease Control  
* **Common Unit of Measure:** per Application  
* **Notes:** Typically involves spraying property perimeters, foliage, and lawn areas. Often sold as a seasonal package with multiple applications.21  
* **Item Name:** Perimeter Pest Control (Home Foundation)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Pest & Disease Control  
* **Common Unit of Measure:** per Application  
* **Notes:** A barrier spray around the home's foundation to prevent insects like ants and spiders from entering the structure.18  
* **Item Name:** Tree & Shrub Insect Control  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Pest & Disease Control  
* **Common Unit of Measure:** per Application or per Hour  
* **Notes:** Includes treatments like horticultural oil for scale insects or targeted sprays for other pests.23  
* **Item Name:** Lawn Disease Control (Fungicide Application)  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Pest & Disease Control  
* **Common Unit of Measure:** per Application or per 1,000 Sq. Ft.  
* **Notes:** Curative treatment for fungal diseases like brown patch, dollar spot, or red thread. Can be expensive and may require multiple applications.24  
* **Item Name:** Tree & Shrub Disease Control  
* **Category:** Fertilization & Treatments  
* **Sub-Category:** Pest & Disease Control  
* **Common Unit of Measure:** per Application or per Hour  
* **Notes:** Targeted treatment for plant-specific diseases like black spot on roses or apple scab.

### **Tree, Shrub & Hedge Care**

These services range from routine maintenance to complex and high-risk removal operations, often requiring specialized equipment and certified expertise. The pricing structure for these items varies significantly based on the complexity, risk, and equipment involved.

#### **Pruning & Trimming**

* **Item Name:** Shrub/Bush Trimming  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Pruning & Trimming  
* **Common Unit of Measure:** per Hour or per Bush  
* **Notes:** General shaping and size maintenance of individual shrubs. Hourly rates are common for larger jobs with many plants.1  
* **Item Name:** Hedge Trimming / Shearing  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Pruning & Trimming  
* **Common Unit of Measure:** per Linear Ft. or per Hour  
* **Notes:** Creating formal, geometric shapes. The work scales predictably with the length and height of the hedge, making per-linear-foot pricing a viable and common method.27  
* **Item Name:** Tree Pruning \- Small (Under 15 ft)  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Pruning & Trimming  
* **Common Unit of Measure:** Each or per Hour  
* **Notes:** Pruning that can be done from the ground or with a small stepladder.  
* **Item Name:** Tree Pruning \- Large (Over 15 ft)  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Pruning & Trimming  
* **Common Unit of Measure:** Each (Priced by Job)  
* **Notes:** Requires climbing or aerial lift equipment. Price is highly variable based on tree size, health, and proximity to structures. This is a high-risk task where a simple unit of measure is insufficient; it must be quoted per tree based on a detailed assessment.29  
* **Item Name:** Ornamental & Corrective Pruning  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Pruning & Trimming  
* **Common Unit of Measure:** per Hour  
* **Notes:** Specialized, detailed pruning to improve plant health, structure, or aesthetics, such as for Japanese maples or fruit trees.29

#### **Removal & Stump Grinding**

* **Item Name:** Shrub/Bush Removal  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Removal & Stump Grinding  
* **Common Unit of Measure:** Each  
* **Notes:** Complete removal of the plant, including the main root ball.  
* **Item Name:** Tree Removal  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Removal & Stump Grinding  
* **Common Unit of Measure:** Each (Priced by Job)  
* **Notes:** The cost is determined by a complex assessment of height, trunk diameter, condition, and location/risk. A simple unit price is not applicable.32 It is useful to have size-based variations (e.g., Small, Medium, Large) as placeholders.  
* **Item Name:** Stump Grinding  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Removal & Stump Grinding  
* **Common Unit of Measure:** per Inch of Diameter  
* **Notes:** The most common and logical pricing method, as the work directly correlates to the stump's diameter. Most services have a minimum charge.34  
* **Item Name:** Stump Grinding Debris Haul-Away  
* **Category:** Tree, Shrub & Hedge Care  
* **Sub-Category:** Removal & Stump Grinding  
* **Common Unit of Measure:** per Stump or per Hour  
* **Notes:** An optional service to remove the resulting wood chips from the property.

### **Hardscaping Installation**

Hardscaping projects are typically high-value, construction-oriented jobs. While the final quote presented to a client is often simplified to a per-square-foot or per-linear-foot price, the contractor's internal calculation is based on a detailed breakdown of site preparation, labor, and all component materials.

#### **Site Preparation & Demolition**

* **Item Name:** Excavation & Grading  
* **Category:** Hardscaping  
* **Sub-Category:** Site Preparation & Demolition  
* **Common Unit of Measure:** per Sq. Ft. or per Hour  
* **Notes:** Preparing the sub-base for patios, walls, or other structures. Cost varies with depth and soil conditions.5  
* **Item Name:** Existing Sod Removal  
* **Category:** Hardscaping  
* **Sub-Category:** Site Preparation & Demolition  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** Mechanical or manual removal of turf in the project area.  
* **Item Name:** Existing Concrete/Paver Demolition  
* **Category:** Hardscaping  
* **Sub-Category:** Site Preparation & Demolition  
* **Common Unit of Measure:** per Sq. Ft. or per Hour  
* **Notes:** Breaking up and removing an existing hardscape surface.  
* **Item Name:** Debris Haul-Away & Disposal  
* **Category:** Hardscaping  
* **Sub-Category:** Site Preparation & Demolition  
* **Common Unit of Measure:** per Load or per Ton  
* **Notes:** Cost to transport and dispose of soil, concrete, or other construction debris.

#### **Patios & Walkways**

* **Item Name:** Paver Patio Installation  
* **Category:** Hardscaping  
* **Sub-Category:** Patios & Walkways  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** A comprehensive price that includes base prep, sand setting bed, pavers, edge restraint, and jointing sand. Prices vary significantly by paver type.36  
* **Item Name:** Paver Walkway Installation  
* **Category:** Hardscaping  
* **Sub-Category:** Patios & Walkways  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** Similar to patio installation but may have a higher per-square-foot cost due to the smaller scale and higher ratio of edge cuts.  
* **Item Name:** Flagstone Patio Installation (Dry-Laid)  
* **Category:** Hardscaping  
* **Sub-Category:** Patios & Walkways  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** Installation on a gravel and sand base without mortar. More labor-intensive than concrete pavers.38  
* **Item Name:** Flagstone Patio Installation (Mortar-Set)  
* **Category:** Hardscaping  
* **Sub-Category:** Patios & Walkways  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** Installation on a concrete slab with mortared joints, representing a premium, higher-cost method.38  
* **Item Name:** Poured Concrete Patio Installation  
* **Category:** Hardscaping  
* **Sub-Category:** Patios & Walkways  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** Includes forming, pouring, and finishing. Add-ons like stamping or coloring increase the cost.39

#### **Retaining & Seating Walls**

* **Item Name:** Retaining Wall Installation (Interlocking Block)  
* **Category:** Hardscaping  
* **Sub-Category:** Retaining & Seating Walls  
* **Common Unit of Measure:** per Sq. Ft. (Face) or per Linear Ft.  
* **Notes:** Price is calculated based on the visible face of the wall. Costs increase with height due to engineering requirements like geogrid reinforcement.40  
* **Item Name:** Retaining Wall Installation (Natural Stone)  
* **Category:** Hardscaping  
* **Sub-Category:** Retaining & Seating Walls  
* **Common Unit of Measure:** per Sq. Ft. (Face)  
* **Notes:** A premium option with higher material and labor costs compared to block walls.  
* **Item Name:** Retaining Wall Installation (Timber)  
* **Category:** Hardscaping  
* **Sub-Category:** Retaining & Seating Walls  
* **Common Unit of Measure:** per Sq. Ft. (Face) or per Linear Ft.  
* **Notes:** Constructed with pressure-treated timbers or railroad ties.  
* **Item Name:** Freestanding Seating Wall Installation  
* **Category:** Hardscaping  
* **Sub-Category:** Retaining & Seating Walls  
* **Common Unit of Measure:** per Linear Ft.  
* **Notes:** A double-sided wall, often capped, designed for patio borders and seating.

#### **Outdoor Living Features**

* **Item Name:** Fire Pit Installation (Kit)  
* **Category:** Hardscaping  
* **Sub-Category:** Outdoor Living Features  
* **Common Unit of Measure:** Each  
* **Notes:** Labor to assemble a pre-packaged fire pit kit, including the block and metal insert.42  
* **Item Name:** Fire Pit Installation (Custom Masonry)  
* **Category:** Hardscaping  
* **Sub-Category:** Outdoor Living Features  
* **Common Unit of Measure:** Each (Priced by Job)  
* **Notes:** A custom-built feature with a concrete footing and masonry construction.  
* **Item Name:** Pergola / Gazebo Installation  
* **Category:** Hardscaping  
* **Sub-Category:** Outdoor Living Features  
* **Common Unit of Measure:** Each  
* **Notes:** Labor to assemble and install a pre-fabricated wood, vinyl, or metal structure.

### **Irrigation & Drainage**

These are technical services that are critical for landscape health and property protection. Pricing is highly standardized based on the system's components and scale.

#### **System Installation & Maintenance**

* **Item Name:** Sprinkler System Installation  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** System Installation  
* **Common Unit of Measure:** per Zone  
* **Notes:** A "zone" is a standard unit of work including one valve and the associated pipes and heads, making it a scalable unit for quoting new systems. Average costs range from $500 to $1,000 per zone.44  
* **Item Name:** Drip Irrigation System Installation  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** System Installation  
* **Common Unit of Measure:** per Zone or per Linear Ft.  
* **Notes:** For garden beds, pots, and shrubs. Can be quoted as its own zone or by the length of tubing installed.  
* **Item Name:** Spring System Start-Up & Inspection  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** System Maintenance & Repair  
* **Common Unit of Measure:** per System or per Visit  
* **Notes:** A flat-fee service to turn on, inspect, and adjust the irrigation system for the season.46  
* **Item Name:** Fall System Winterization / Blow-Out  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** System Maintenance & Repair  
* **Common Unit of Measure:** per System or per Visit  
* **Notes:** A flat-fee service to purge water from the lines with compressed air to prevent freeze damage.46  
* **Item Name:** Irrigation System Repair  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** System Maintenance & Repair  
* **Common Unit of Measure:** per Hour \+ Parts  
* **Notes:** For troubleshooting and fixing leaks, broken heads, or faulty valves. Typically involves a service call fee plus an hourly rate.46

#### **Drainage Solutions**

* **Item Name:** French Drain Installation  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** Drainage Solutions  
* **Common Unit of Measure:** per Linear Ft.  
* **Notes:** The work involved scales directly with the length of the trench, making this the industry-standard unit of measure.48  
* **Item Name:** Catch Basin / Channel Drain Installation  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** Drainage Solutions  
* **Common Unit of Measure:** Each (Catch Basin) or per Linear Ft. (Channel Drain)  
* **Notes:** For capturing surface water in specific low spots or along hardscapes.  
* **Item Name:** Downspout Extension & Burial  
* **Category:** Irrigation & Drainage  
* **Sub-Category:** Drainage Solutions  
* **Common Unit of Measure:** per Downspout or per Linear Ft.  
* **Notes:** Connecting gutter downspouts to underground piping to direct water away from the foundation.

### **Installation Services (General)**

This category isolates the labor component for installing materials that are purchased separately. This structure provides quoting transparency, especially for planting, where material costs (the plants) and labor costs can vary significantly.

* **Item Name:** Annual & Perennial Planting  
* **Category:** Installation Services  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Flat or per Hour  
* **Notes:** Labor to install flats of annual flowers or individual small perennials.  
* **Item Name:** Shrub & Tree Planting  
* **Category:** Installation Services  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Each (by container size)  
* **Notes:** Labor costs scale with the size of the plant. It is best practice to have separate line items for different container sizes (e.g., \#1 gal, \#5 gal, \#15 gal).50  
* **Item Name:** Sod Installation  
* **Category:** Installation Services  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** This service can be quoted as labor-only, but is more commonly bundled with the material into a single "Installed Sod" price.51  
* **Item Name:** Lawn Seeding / Hydroseeding  
* **Category:** Installation Services  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Sq. Ft.  
* **Notes:** Labor and equipment charge for applying seed to a prepared area.  
* **Item Name:** Landscape Fabric Installation  
* **Category:** Installation Services  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Sq. Ft. or per Roll  
* **Notes:** Labor to lay out, cut, and pin landscape fabric in garden beds.

### **Seasonal Services**

This category includes services tied to specific times of the year, particularly spring, fall, and winter. They are often weather-dependent and require flexible pricing models.

#### **Yard Cleanup**

* **Item Name:** Spring Cleanup  
* **Category:** Seasonal Services  
* **Sub-Category:** Yard Cleanup  
* **Common Unit of Measure:** Flat Fee or per Hour  
* **Notes:** A package service that typically includes removing winter debris, cutting back remaining perennials, and defining bed edges. Often quoted as a flat fee for standard properties.53  
* **Item Name:** Fall Cleanup  
* **Category:** Seasonal Services  
* **Sub-Category:** Yard Cleanup  
* **Common Unit of Measure:** Flat Fee or per Hour  
* **Notes:** A package service focused on leaf removal and preparing the landscape for winter. Can be more expensive than spring cleanup due to the volume of leaves.55  
* **Item Name:** Overgrown Yard Cleanup  
* **Category:** Seasonal Services  
* **Sub-Category:** Yard Cleanup  
* **Common Unit of Measure:** per Hour  
* **Notes:** For severely neglected properties where the scope of work is difficult to estimate. An hourly rate protects the contractor from unforeseen challenges.54

#### **Debris & Snow Management**

* **Item Name:** Leaf Removal  
* **Category:** Seasonal Services  
* **Sub-Category:** Debris Management  
* **Common Unit of Measure:** per Visit, per Hour, or per Cubic Yard  
* **Notes:** Can be a standalone service or part of a fall cleanup package. Pricing depends on volume and method (blowing, raking, vacuuming).57  
* **Item Name:** Gutter Cleaning  
* **Category:** Seasonal Services  
* **Sub-Category:** Debris Management  
* **Common Unit of Measure:** per Linear Ft. or Flat Fee  
* **Notes:** A common and important fall service add-on.  
* **Item Name:** Snow Plowing / Blowing  
* **Category:** Seasonal Services  
* **Sub-Category:** Snow & Ice Management  
* **Common Unit of Measure:** per Push, per Inch, per Hour, or Seasonal Contract  
* **Notes:** Snow services require multiple pricing structures to account for unpredictability. "Per Push" is for single visits, while seasonal contracts offer clients peace of mind for a flat rate.59  
* **Item Name:** De-icing Application (Salt/Sand)  
* **Category:** Seasonal Services  
* **Sub-Category:** Snow & Ice Management  
* **Common Unit of Measure:** per Application or per Bag/Bucket  
* **Notes:** Application of ice melt to driveways and walkways, often billed per visit or included in a premium contract.

### **General Labor**

A crucial category for capturing costs associated with tasks that don't fit neatly into other service descriptions. This ensures all time and operational costs are accounted for, leading to more profitable quoting.

* **Item Name:** General Labor \- Skilled  
* **Category:** General Labor  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour  
* **Notes:** For miscellaneous tasks requiring some level of expertise or operation of specific equipment.  
* **Item Name:** General Labor \- Unskilled  
* **Category:** General Labor  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Hour  
* **Notes:** For basic tasks like moving materials, site cleanup, or assisting skilled workers. The billable rate should be significantly higher than the employee's wage to cover overhead.9  
* **Item Name:** Material Delivery & Staging Fee  
* **Category:** General Labor  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Flat Fee or per Trip  
* **Notes:** A specific line item to cover the non-billable time and expense of picking up and delivering materials to a job site. This is a real business cost that must be passed on to the client.62

## **II. Materials Database**

This section details the physical products and goods sold to a client as part of a project. The organization is designed for quick and accurate selection during quote creation, with units of measure that reflect how these items are purchased from suppliers.

### **Soil, Sand & Aggregates**

These are the foundational bulk materials for nearly all landscape construction and planting projects. The distinction between pricing by volume (cubic yard) for lighter organic materials and by weight (ton) for dense aggregates is a critical industry standard.

#### **Soils & Compost**

* **Item Name:** Screened Topsoil  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Soils & Compost  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** All-purpose soil for grading and establishing new lawns.64  
* **Item Name:** Garden Mix (Topsoil/Compost Blend)  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Soils & Compost  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** A premium blend ideal for new garden beds and planting.66  
* **Item Name:** Organic Compost  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Soils & Compost  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** Used as a soil amendment to improve structure and add nutrients.68  
* **Item Name:** Fill Dirt (Unscreened)  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Soils & Compost  
* **Common Unit of Measure:** per Cubic Yard or per Ton  
* **Notes:** Low-cost material for filling large depressions or building up grade where soil quality is not a concern.69

#### **Sands & Aggregates**

* **Item Name:** Mason Sand  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Sands  
* **Common Unit of Measure:** per Ton or per Bag  
* **Notes:** Fine-textured sand used for mortar, paver joints, and sandboxes.71  
* **Item Name:** Coarse Sand / Concrete Sand  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Sands  
* **Common Unit of Measure:** per Ton or per Bag  
* **Notes:** Used as a leveling base for pavers and in concrete mixes.71  
* **Item Name:** Polymeric Sand  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Sands  
* **Common Unit of Measure:** per Bag  
* **Notes:** A sand with additives that hardens when wet, used to lock pavers in place and inhibit weeds.  
* **Item Name:** Pea Gravel  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Aggregates & Gravel  
* **Common Unit of Measure:** per Ton or per Bag  
* **Notes:** Small, rounded stones used for pathways, drainage, and as a decorative ground cover.74  
* **Item Name:** River Rock (1-3 inch)  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Aggregates & Gravel  
* **Common Unit of Measure:** per Ton or per Bag  
* **Notes:** Larger, rounded decorative stone for creek beds, accents, and ground cover.64  
* **Item Name:** Crushed Stone (\#57)  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Aggregates & Gravel  
* **Common Unit of Measure:** per Ton  
* **Notes:** Angular gravel (typically 3/4-inch) used as a base for driveways, patios, and retaining walls.69  
* **Item Name:** Decomposed Granite  
* **Category:** Soil, Sand & Aggregates  
* **Sub-Category:** Aggregates & Gravel  
* **Common Unit of Measure:** per Ton or per Bag  
* **Notes:** Fine, crushed granite that compacts well for natural-looking pathways and patios.74

### **Mulch & Ground Cover**

These materials are applied to the surface of garden beds to retain moisture, suppress weeds, and provide a finished aesthetic. The choice of mulch can significantly impact a project's cost and long-term maintenance needs.

#### **Organic & Inorganic Mulch**

* **Item Name:** Double-Shredded Hardwood Mulch  
* **Category:** Mulch & Ground Cover  
* **Sub-Category:** Organic Mulch  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** The most common and cost-effective landscape mulch.12  
* **Item Name:** Dyed Hardwood Mulch (Black, Brown, Red)  
* **Category:** Mulch & Ground Cover  
* **Sub-Category:** Organic Mulch  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** Color-enhanced mulch that retains its color longer than natural hardwood.78  
* **Item Name:** Cedar Mulch  
* **Category:** Mulch & Ground Cover  
* **Sub-Category:** Organic Mulch  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** A premium mulch known for its pleasant aroma, lighter color, and natural insect-repelling properties.77  
* **Item Name:** Pine Bark Mulch (Nuggets or Fines)  
* **Category:** Mulch & Ground Cover  
* **Sub-Category:** Organic Mulch  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** Lightweight and acidic, beneficial for plants like azaleas and rhododendrons.13  
* **Item Name:** Pine Straw  
* **Category:** Mulch & Ground Cover  
* **Sub-Category:** Organic Mulch  
* **Common Unit of Measure:** per Bale  
* **Notes:** Lightweight and popular in the southeastern U.S., sold by the bale which has a specific square foot coverage.  
* **Item Name:** Rubber Mulch  
* **Category:** Mulch & Ground Cover  
* **Sub-Category:** Inorganic Ground Cover  
* **Common Unit of Measure:** per Cubic Yard or per Bag  
* **Notes:** Made from recycled tires, it is very long-lasting but also the most expensive option. Popular for playgrounds.13

A key sales opportunity lies in educating clients on the benefits of different mulch types. A simple comparison can help justify upselling from a basic mulch to a premium, longer-lasting, or more functionally beneficial option.

| Mulch Type | Average Cost per Yard (Materials) | Lifespan | Key Benefits |
| :---- | :---- | :---- | :---- |
| Shredded Hardwood | $30 \- $65 | 1-2 years | Cost-effective, enriches soil as it decomposes.77 |
| Cedar Mulch | $45 \- $90 | 2-3 years | Naturally repels insects, pleasant aroma, decomposes slowly.77 |
| Pine Bark | $20 \- $60 | 2-3 years | Lightweight, good for acid-loving plants.77 |
| Rubber Mulch | $80 \- $160 | 10+ years | Extremely durable, excellent for playgrounds, does not decompose.77 |
| Stone/Gravel | $40 \- $120 | Permanent | One-time investment, excellent drainage, non-flammable.77 |

### **Hardscape Materials**

This category includes the specific components used in hardscape construction. The units of measure are highly specific to the material type and are critical for accurate ordering and job costing.

#### **Pavers, Stone, & Wall Block**

* **Item Name:** Concrete Pavers (Standard)  
* **Category:** Hardscape Materials  
* **Sub-Category:** Pavers & Flagstone  
* **Common Unit of Measure:** per Sq. Ft. or per Pallet  
* **Notes:** The most common type of paver, available in various shapes and colors.80  
* **Item Name:** Brick Pavers  
* **Category:** Hardscape Materials  
* **Sub-Category:** Pavers & Flagstone  
* **Common Unit of Measure:** per Sq. Ft. or per Pallet  
* **Notes:** Made from clay, offering a classic aesthetic.80  
* **Item Name:** Natural Flagstone  
* **Category:** Hardscape Materials  
* **Sub-Category:** Pavers & Flagstone  
* **Common Unit of Measure:** per Ton, per Pallet, or per Sq. Ft.  
* **Notes:** Includes varieties like bluestone, sandstone, and quartzite. Sold by weight (ton) or by the pallet, which has an approximate square foot coverage.82  
* **Item Name:** Interlocking Retaining Wall Block  
* **Category:** Hardscape Materials  
* **Sub-Category:** Wall Blocks & Caps  
* **Common Unit of Measure:** Each or per Sq. Ft. (Face)  
* **Notes:** Engineered blocks for building retaining walls.  
* **Item Name:** Wall Caps  
* **Category:** Hardscape Materials  
* **Sub-Category:** Wall Blocks & Caps  
* **Common Unit of Measure:** Each or per Linear Ft.  
* **Notes:** The finishing pieces for the top of retaining or seating walls.

#### **Timbers & Edging**

* **Item Name:** Pressure-Treated Landscape Timber  
* **Category:** Hardscape Materials  
* **Sub-Category:** Timbers & Edging  
* **Common Unit of Measure:** Each  
* **Notes:** Commonly sold in standard dimensions like 6 in x 6 in x 8 ft.84  
* **Item Name:** Plastic Landscape Edging  
* **Category:** Hardscape Materials  
* **Sub-Category:** Timbers & Edging  
* **Common Unit of Measure:** per Roll or per Kit  
* **Notes:** An economical option for defining bed lines, typically sold in rolls of 20 ft or 40 ft.86  
* **Item Name:** Steel or Aluminum Landscape Edging  
* **Category:** Hardscape Materials  
* **Sub-Category:** Timbers & Edging  
* **Common Unit of Measure:** per Piece or per Linear Ft.  
* **Notes:** A durable, long-lasting, and more premium edging option.87

### **Plant Materials**

For quoting purposes, it is most practical to categorize plants by type and standardized container size rather than by individual species. This allows for rapid quote generation, with specific species names added to the notes for clarity. This structure reflects how many contractors generalize costs for quoting, as wholesale pricing is highly correlated with size.

* **Item Name:** Annuals  
* **Category:** Plant Materials  
* **Sub-Category:** Annuals  
* **Common Unit of Measure:** per Flat (e.g., 48 plants) or per Pack (e.g., 6-pack)  
* **Notes:** For seasonal color in beds and containers.88  
* **Item Name:** Perennial \- 1 Gallon (\#1)  
* **Category:** Plant Materials  
* **Sub-Category:** Perennials  
* **Common Unit of Measure:** Each  
* **Notes:** A standard size for many common perennials and ornamental grasses.89  
* **Item Name:** Shrub \- 3 Gallon (\#3)  
* **Category:** Plant Materials  
* **Sub-Category:** Shrubs  
* **Common Unit of Measure:** Each  
* **Notes:** A common size for landscape shrubs used for foundation plantings and borders.50  
* **Item Name:** Shrub \- 5 Gallon (\#5)  
* **Category:** Plant Materials  
* **Sub-Category:** Shrubs  
* **Common Unit of Measure:** Each  
* **Notes:** A larger, more established shrub for immediate impact.50  
* **Item Name:** Tree \- 15 Gallon (\#15)  
* **Category:** Plant Materials  
* **Sub-Category:** Trees  
* **Common Unit of Measure:** Each  
* **Notes:** A common size for ornamental and smaller shade trees.50  
* **Item Name:** Tree \- Balled & Burlapped (B\&B)  
* **Category:** Plant Materials  
* **Sub-Category:** Trees  
* **Common Unit of Measure:** Each (by caliper inch)  
* **Notes:** For larger, field-grown trees. Price is determined by the trunk diameter (caliper), e.g., "2-inch Caliper B\&B Maple".50

### **Lawn Establishment Materials**

These materials are used specifically for creating new lawn areas, either through seeding or sodding. The available types are highly regional.

* **Item Name:** Tall Fescue Sod  
* **Category:** Plant Materials  
* **Sub-Category:** Sod  
* **Common Unit of Measure:** per Sq. Ft., per Roll, or per Pallet  
* **Notes:** A common cool-season grass. Sod is typically ordered by the pallet, which covers a standard area (e.g., 450-500 sq. ft.).91  
* **Item Name:** St. Augustine Sod  
* **Category:** Plant Materials  
* **Sub-Category:** Sod  
* **Common Unit of Measure:** per Sq. Ft., per Roll, or per Pallet  
* **Notes:** A common warm-season grass, popular in southern climates.91  
* **Item Name:** Tall Fescue Grass Seed  
* **Category:** Plant Materials  
* **Sub-Category:** Seed  
* **Common Unit of Measure:** per Bag (e.g., 50 lb. Bag)  
* **Notes:** Seed is sold by weight, with the bag label indicating the square foot coverage for new lawns and overseeding.94  
* **Item Name:** Sun & Shade Mix Grass Seed  
* **Category:** Plant Materials  
* **Sub-Category:** Seed  
* **Common Unit of Measure:** per Bag (e.g., 20 lb. Bag)  
* **Notes:** A versatile blend for residential lawns with mixed sun exposure.96

### **Fertilizers & Chemicals**

These items represent the contractor's cost-of-goods for treatment services. While a client is billed for an "application service," the contractor's profitability depends on accurately tracking the consumption of these materials, which are purchased by the bag, bottle, or gallon.

* **Item Name:** Granular Lawn Fertilizer (50 lb. Bag)  
* **Category:** Fertilizers & Chemicals  
* **Sub-Category:** Fertilizers  
* **Common Unit of Measure:** per Bag  
* **Notes:** Standard slow-release fertilizer. The N-P-K ratio (e.g., 24-0-6) should be specified in the item description or notes.98  
* **Item Name:** Liquid Broadleaf Weed Control (1 Gallon Concentrate)  
* **Category:** Fertilizers & Chemicals  
* **Sub-Category:** Herbicides  
* **Common Unit of Measure:** per Gallon  
* **Notes:** Concentrate for post-emergent control of dandelions, clover, etc..11  
* **Item Name:** Granular Grub Control (15 lb. Bag)  
* **Category:** Fertilizers & Chemicals  
* **Sub-Category:** Pesticides & Fungicides  
* **Common Unit of Measure:** per Bag  
* **Notes:** For preventative or curative control of white grubs.101  
* **Item Name:** Pelletized Lime (40 lb. Bag)  
* **Category:** Fertilizers & Chemicals  
* **Sub-Category:** Soil Amendments  
* **Common Unit of Measure:** per Bag  
* **Notes:** Used to raise soil pH in acidic soils.

### **Irrigation Components**

This granular list of individual parts is essential for building accurate repair quotes. For new installations, these components are typically bundled into the "per Zone" service price, but for repairs, they must be itemized to ensure transparency and profitability.

* **Item Name:** 4-inch Pop-Up Spray Head  
* **Category:** Irrigation Components  
* **Sub-Category:** Heads & Nozzles  
* **Common Unit of Measure:** Each  
* **Notes:** The most common sprinkler head in residential systems.47  
* **Item Name:** Rotor Head  
* **Category:** Irrigation Components  
* **Sub-Category:** Heads & Nozzles  
* **Common Unit of Measure:** Each  
* **Notes:** For larger turf areas, providing a rotating stream of water.102  
* **Item Name:** Electric Zone Valve (1-inch)  
* **Category:** Irrigation Components  
* **Sub-Category:** Valves & Manifolds  
* **Common Unit of Measure:** Each  
* **Notes:** The electronic valve that controls water flow to a specific zone.103  
* **Item Name:** Smart Irrigation Controller (8-Zone)  
* **Category:** Irrigation Components  
* **Sub-Category:** Controllers & Sensors  
* **Common Unit of Measure:** Each  
* **Notes:** A Wi-Fi enabled controller that adjusts watering based on weather data, saving water.44  
* **Item Name:** PVC Pipe \- Schedule 40 (1-inch x 10 ft)  
* **Category:** Irrigation Components  
* **Sub-Category:** Pipe & Fittings  
* **Common Unit of Measure:** Each (per 10 ft length)  
* **Notes:** Standard rigid pipe for main and lateral irrigation lines.

### **Miscellaneous**

This category captures essential but often overlooked ancillary materials. While the cost of these items might be absorbed into a larger service price on a client's quote, they are a real cost to the contractor and must be available in the database for accurate job costing.

* **Item Name:** Woven Landscape Fabric (3 ft wide)  
* **Category:** Miscellaneous  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Roll or per Linear Ft.  
* **Notes:** Durable fabric used under stone or for weed control.106  
* **Item Name:** Landscape Fabric Staples  
* **Category:** Miscellaneous  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Box or Each  
* **Notes:** Metal pins used to secure landscape fabric to the ground.108  
* **Item Name:** Tree Stake (Wooden or Metal)  
* **Category:** Miscellaneous  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** Each  
* **Notes:** Used to support newly planted trees.  
* **Item Name:** Tree Wrap  
* **Category:** Miscellaneous  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Roll  
* **Notes:** Protective wrap for the trunks of young trees to prevent sunscald and damage.107  
* **Item Name:** Corrugated Drainage Pipe (4-inch Perforated)  
* **Category:** Miscellaneous  
* **Sub-Category:** N/A  
* **Common Unit of Measure:** per Roll (e.g., 100 ft)  
* **Notes:** Flexible pipe used for French drains and other drainage solutions.111

#### **Referências citadas**

1. How Much to Charge For Lawn Mowing: Pricing Charts and Formula \- Jobber, acessado em julho 23, 2025, [https://www.getjobber.com/academy/lawn-care/how-to-price-out-lawn-care-services/](https://www.getjobber.com/academy/lawn-care/how-to-price-out-lawn-care-services/)  
2. How to Measure Your Yard \- The Grass Outlet, acessado em julho 23, 2025, [https://thegrassoutlet.com/grass-care/before-you-plant/measure-your-space/](https://thegrassoutlet.com/grass-care/before-you-plant/measure-your-space/)  
3. How Much Does Landscape Design Cost? (2025) \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/landscape-design-cost](https://homeguide.com/costs/landscape-design-cost)  
4. How Much Does a Landscape Designer Cost? Top Rates in 2024, acessado em julho 23, 2025, [https://mcleodlandscaping.com/how-much-does-a-landscape-designer-cost/](https://mcleodlandscaping.com/how-much-does-a-landscape-designer-cost/)  
5. How to Price Landscaping Jobs for Profitability in 8 Steps \- RealGreen Blog, acessado em julho 23, 2025, [https://blog.realgreen.com/how-to-estimate-landscaping-jobs/](https://blog.realgreen.com/how-to-estimate-landscaping-jobs/)  
6. How to Price Landscaping Jobs in 7 Steps: A Simple Guide \- FreshBooks, acessado em julho 23, 2025, [https://www.freshbooks.com/hub/estimates/estimate-landscaping-jobs](https://www.freshbooks.com/hub/estimates/estimate-landscaping-jobs)  
7. Lawn Maintenance \- Wisconsin Horticulture, acessado em julho 23, 2025, [https://hort.extension.wisc.edu/articles/lawn-maintenance/](https://hort.extension.wisc.edu/articles/lawn-maintenance/)  
8. The Essential Lawn Care Services List Your Clients Want To See \- Joist, acessado em julho 23, 2025, [https://www.joist.com/blog/lawn-care-services-list/](https://www.joist.com/blog/lawn-care-services-list/)  
9. 2025 Landscaping Costs | Average Prices List | Per Square Foot & Hour \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/landscaping-costs](https://homeguide.com/costs/landscaping-costs)  
10. 2025 Average Gardener Costs & Price List | Hourly & Monthly Rates, acessado em julho 23, 2025, [https://homeguide.com/costs/gardener-cost](https://homeguide.com/costs/gardener-cost)  
11. 2025 Weed Control Cost | Weeding Prices (Spraying vs. Pulling) \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/weed-control-cost](https://homeguide.com/costs/weed-control-cost)  
12. How Much Does Mulch Cost? (2025) \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/mulch-prices](https://homeguide.com/costs/mulch-prices)  
13. How Much Does Mulch Cost in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/mulch-cost/](https://lawnlove.com/blog/mulch-cost/)  
14. 2025 Lawn Fertilization Costs | Lawn Treatment Services Cost \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/lawn-fertilizer-service-cost](https://homeguide.com/costs/lawn-fertilizer-service-cost)  
15. How Much Does It Cost to Fertilize Your Lawn? \[2025 Data\] \- Angie's List, acessado em julho 23, 2025, [https://www.angi.com/articles/how-much-does-it-cost-fertilize-your-yard.htm](https://www.angi.com/articles/how-much-does-it-cost-fertilize-your-yard.htm)  
16. www.lawnstarter.com, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/lawn-fertilization-price/](https://www.lawnstarter.com/blog/cost/lawn-fertilization-price/)  
17. Beginner's Guide to Lawn Care | Golf Course Lawn Store, acessado em julho 23, 2025, [https://golfcourselawn.store/pages/beginners-guide-to-lawn-care](https://golfcourselawn.store/pages/beginners-guide-to-lawn-care)  
18. Affordable Lawn Care Plans & Pricing Options \- TruGreen, acessado em julho 23, 2025, [https://www.trugreen.com/products-and-services](https://www.trugreen.com/products-and-services)  
19. How Much Does Weed Control Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/weed-control-price/](https://www.lawnstarter.com/blog/cost/weed-control-price/)  
20. How Much Does Lawn Weed Control Cost in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/weed-control-cost/](https://lawnlove.com/blog/weed-control-cost/)  
21. TruGreen: Affordable Lawn Care Maintenance & Treatment Services, acessado em julho 23, 2025, [https://www.trugreen.com/](https://www.trugreen.com/)  
22. How Much Does Pest Control Cost? (2025 Guide) \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/pest-control-prices](https://homeguide.com/costs/pest-control-prices)  
23. Tree & Shrub Services | Matthews, Weddington & Ballantyne, NC | Carolina Turf Lawn and Landscape, acessado em julho 23, 2025, [https://www.carolinasturf.com/tree-shrub-services/](https://www.carolinasturf.com/tree-shrub-services/)  
24. Lawn Fungus Control: Does it Work, Cost, & Tips for Minneapolis & Eau Claire, WI, acessado em julho 23, 2025, [https://www.rainmasterlawn.com/blog/lawn-fungus-control-does-work-cost-tips-wi](https://www.rainmasterlawn.com/blog/lawn-fungus-control-does-work-cost-tips-wi)  
25. Lawn Fungus Treatments: Costs, Types, and Do They Work?, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/lawn-care-2/lawn-fungus-treatments/](https://www.lawnstarter.com/blog/lawn-care-2/lawn-fungus-treatments/)  
26. 10 Best Tree Care Services in Wesley Chapel, FL | Tree Trimming \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/wesley-chapel-fl-tree-care](https://www.lawnstarter.com/wesley-chapel-fl-tree-care)  
27. How Much Does Hedge Trimming Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/hedge-trimming-price/](https://www.lawnstarter.com/blog/cost/hedge-trimming-price/)  
28. 2025 Hedge Trimming Costs — By Length, Height, & Hourly \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/hedge-trimming-cost](https://homeguide.com/costs/hedge-trimming-cost)  
29. Professional Tree and Shrub-Trimming and Pruning Services, acessado em julho 23, 2025, [https://www.monstertreeservice.com/our-services/tree-shrub-pruning-trimming/](https://www.monstertreeservice.com/our-services/tree-shrub-pruning-trimming/)  
30. How Much Does it Cost to Cut Down a Tree | Tree Removal \- Richard's Tree Service, acessado em julho 23, 2025, [https://richardstreeservice.com/about/resources/tree-removal-costs.php](https://richardstreeservice.com/about/resources/tree-removal-costs.php)  
31. Lawn Services in Houston| The Grounds Guys of Memorial Park, acessado em julho 23, 2025, [https://www.groundsguys.com/memorial-park/residential-services/lawn-bed-maintenance/lawn-maintenance/](https://www.groundsguys.com/memorial-park/residential-services/lawn-bed-maintenance/lawn-maintenance/)  
32. Pricing Guide: How Much Does Tree Removal Cost? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/tree-removal-price/](https://www.lawnstarter.com/blog/cost/tree-removal-price/)  
33. 2025 Tree Removal Costs — Prices To Cut Down A Tree By Size \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/tree-removal-cost](https://homeguide.com/costs/tree-removal-cost)  
34. Pricing Guide: How Much Does Stump Grinding Cost? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/stump-grinding-price/](https://www.lawnstarter.com/blog/cost/stump-grinding-price/)  
35. How Much Does Stump Grinding Cost? \[2025 Data\] \- Angie's List, acessado em julho 23, 2025, [https://www.angi.com/articles/how-much-does-stump-grinding-cost.htm](https://www.angi.com/articles/how-much-does-stump-grinding-cost.htm)  
36. Pricing Guide: How Much Does a Paver Patio Cost?, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/paver-patio-price/](https://www.lawnstarter.com/blog/cost/paver-patio-price/)  
37. Hardscape Guide & Cost Calculator | Paver Patio, Retaining Wall, acessado em julho 23, 2025, [https://www.easton-outdoors.com/hardscapes-guide/](https://www.easton-outdoors.com/hardscapes-guide/)  
38. How Much Does a Flagstone Patio Cost in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/flagstone-patio-cost/](https://lawnlove.com/blog/flagstone-patio-cost/)  
39. How Much Does a Patio Cost? (2025) \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/patio-cost](https://homeguide.com/costs/patio-cost)  
40. 2025 Retaining Wall Cost — Cost To Build Per Foot & By Type, acessado em julho 23, 2025, [https://homeguide.com/costs/retaining-wall-cost](https://homeguide.com/costs/retaining-wall-cost)  
41. How Much Does a Retaining Wall Cost in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/retaining-wall-cost/](https://lawnlove.com/blog/retaining-wall-cost/)  
42. How Much Does a Fire Pit Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/fire-pit-price/](https://www.lawnstarter.com/blog/cost/fire-pit-price/)  
43. How Much Does a Fire Pit Cost? (2025 Prices) \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/fire-pit-cost](https://homeguide.com/costs/fire-pit-cost)  
44. 2025 Sprinkler System Cost | Cost To Install Irrigation System \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/sprinkler-system-install-cost](https://homeguide.com/costs/sprinkler-system-install-cost)  
45. How Much Does it Cost to Install a Sprinkler System in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/sprinkler-system-cost/](https://lawnlove.com/blog/sprinkler-system-cost/)  
46. Irrigation and Drainage Systems \- Roanoke Landscapes, acessado em julho 23, 2025, [https://roanokelandscapes.com/services/irrigation-and-drainage-systems](https://roanokelandscapes.com/services/irrigation-and-drainage-systems)  
47. Pricing \- Sprinkler Doctor, acessado em julho 23, 2025, [https://www.sprinklerdoctor.org/pricing/](https://www.sprinklerdoctor.org/pricing/)  
48. How Much Does a French Drain Cost? \- HouseLogic, acessado em julho 23, 2025, [https://www.houselogic.com/organize-maintain/home-maintenance-tips/french-drain-cost/](https://www.houselogic.com/organize-maintain/home-maintenance-tips/french-drain-cost/)  
49. French Drain Cost: 2025 Pricing, Installation, Materials & Savings, acessado em julho 23, 2025, [https://modernize.com/gutters/french-drain-cost](https://modernize.com/gutters/french-drain-cost)  
50. Installation Costs | Kingdom Landscaping, acessado em julho 23, 2025, [https://kingdomlandscaping.com/landscaping/installation-costs](https://kingdomlandscaping.com/landscaping/installation-costs)  
51. How Much Does Sod Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/sod-price/](https://www.lawnstarter.com/blog/cost/sod-price/)  
52. How Much Does Sod Installation Cost? \[2025 Data\] | Angi, acessado em julho 23, 2025, [https://www.angi.com/articles/how-much-does-it-cost-lay-sod.htm](https://www.angi.com/articles/how-much-does-it-cost-lay-sod.htm)  
53. How Much Does Yard Cleanup Cost? \[2025 Data\] | Angi, acessado em julho 23, 2025, [https://www.angi.com/articles/yard-clean-up-cost.htm](https://www.angi.com/articles/yard-clean-up-cost.htm)  
54. 2025 Yard Clean Up Cost – Overgrown & Spring Cleanup Cost \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/yard-cleanup-cost](https://homeguide.com/costs/yard-cleanup-cost)  
55. Yard Clean-Up Cost | Yard Cleaning Prices | Fixr, acessado em julho 23, 2025, [https://www.fixr.com/costs/yard-clean-up-service](https://www.fixr.com/costs/yard-clean-up-service)  
56. How Much Does Yard Cleanup Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/yard-cleanup-price/](https://www.lawnstarter.com/blog/cost/yard-cleanup-price/)  
57. How Much Does Leaf Removal Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/leaf-removal-price/](https://www.lawnstarter.com/blog/cost/leaf-removal-price/)  
58. Leaf Clean-Up Cost | Leaf Removal Cost \- Fixr.com, acessado em julho 23, 2025, [https://www.fixr.com/costs/leaf-clean-up](https://www.fixr.com/costs/leaf-clean-up)  
59. How Much Does Snow Removal Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/snow-removal-price/](https://www.lawnstarter.com/blog/cost/snow-removal-price/)  
60. 2025 Snow Removal Prices | Plowing Rates, Services & Calculator \- HomeGuide, acessado em julho 23, 2025, [https://homeguide.com/costs/snow-removal-cost](https://homeguide.com/costs/snow-removal-cost)  
61. www.ziprecruiter.com, acessado em julho 23, 2025, [https://www.ziprecruiter.com/Salaries/Landscape-Laborer-Salary\#:\~:text=As%20of%20Jul%2010%2C%202025,States%20is%20%2417.63%20an%20hour.](https://www.ziprecruiter.com/Salaries/Landscape-Laborer-Salary#:~:text=As%20of%20Jul%2010%2C%202025,States%20is%20%2417.63%20an%20hour.)  
62. Bulk Landscape Material Delivery \- Dirt Exchange, acessado em julho 23, 2025, [https://dirtexchange.us/pages/bulk-landscape-material-delivery](https://dirtexchange.us/pages/bulk-landscape-material-delivery)  
63. Kennesaw Landscape Supply | Order Online for Delivery, acessado em julho 23, 2025, [https://www.cumminlandscapesupply.com/kennesaw](https://www.cumminlandscapesupply.com/kennesaw)  
64. Bulk Material Pricing \- Earthcon Landscape Supply, acessado em julho 23, 2025, [https://www.earthconlandscapesupply.com/bulk-material-pricing.html](https://www.earthconlandscapesupply.com/bulk-material-pricing.html)  
65. How Much Does Topsoil Cost in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/topsoil-cost/](https://lawnlove.com/blog/topsoil-cost/)  
66. Garden Mix (compost & topsoil) per cubic yard \- Adirondack Landscape Supply, acessado em julho 23, 2025, [https://adirondacklandscapesupply.com/products/garden-mix-compost-topsoil-per-cubic-yard](https://adirondacklandscapesupply.com/products/garden-mix-compost-topsoil-per-cubic-yard)  
67. Topsoil Plus \- St. Louis Composting, Inc., acessado em julho 23, 2025, [https://store.stlcompost.com/product/soil/topsoil-plus/](https://store.stlcompost.com/product/soil/topsoil-plus/)  
68. 2025 Compost Costs | Bulk Prices by Cubic Yard, Ton, & Type, acessado em julho 23, 2025, [https://homeguide.com/costs/compost-cost](https://homeguide.com/costs/compost-cost)  
69. Price List – Landscaping Supplies, Mulch, Stone, Gravel, Soil ..., acessado em julho 23, 2025, [https://jmjcompanies.com/price-list/](https://jmjcompanies.com/price-list/)  
70. Topsoil & Compost \- Treesdale Landscape Company, acessado em julho 23, 2025, [https://www.treesdalelandscape.com/product-category/supply-yard/topsoil-compost/](https://www.treesdalelandscape.com/product-category/supply-yard/topsoil-compost/)  
71. Bulk & Bagged Sand \- Bzak Landscaping, acessado em julho 23, 2025, [https://www.bzak.com/product-category/bulkbagged-sand/](https://www.bzak.com/product-category/bulkbagged-sand/)  
72. Price list | aggregatemarkets.com | Soil, sand, gravel, acessado em julho 23, 2025, [https://aggregatemarkets.com/price-list](https://aggregatemarkets.com/price-list)  
73. Bulk Garden & Landscape Materials \- Sky Nursery, acessado em julho 23, 2025, [https://www.skynursery.com/bulk-calculator/](https://www.skynursery.com/bulk-calculator/)  
74. How Much Does River Rock Cost in 2025? \- Lawn Love, acessado em julho 23, 2025, [https://lawnlove.com/blog/river-rock-cost/](https://lawnlove.com/blog/river-rock-cost/)  
75. Cost of Landscaping Stones | River Rock Prices \- Fixr.com, acessado em julho 23, 2025, [https://www.fixr.com/costs/landscaping-stones](https://www.fixr.com/costs/landscaping-stones)  
76. River Rock \- Piedmont Landscape Materials, acessado em julho 23, 2025, [https://piedmontlandscapematerials.com/pages/river-rock](https://piedmontlandscapematerials.com/pages/river-rock)  
77. how much does mulch cost to install: 8 Best Factors for 2025, acessado em julho 23, 2025, [https://ajmgrounds.com/how-much-does-mulch-cost-to-install/](https://ajmgrounds.com/how-much-does-mulch-cost-to-install/)  
78. VA Greenhouse TA London Bridge \- Virginia Beach, VA \- Bulk ..., acessado em julho 23, 2025, [https://www.londonbridgegreenhouse.com/bulk-materials](https://www.londonbridgegreenhouse.com/bulk-materials)  
79. Bulk Mulch \- Ohio Mulch, acessado em julho 23, 2025, [https://www.ohiomulch.com/collections/bulk-mulch](https://www.ohiomulch.com/collections/bulk-mulch)  
80. How much is a Pallet of Pavers Cost, acessado em julho 23, 2025, [https://ntpavers.com/how-much-is-a-pallet-of-pavers/](https://ntpavers.com/how-much-is-a-pallet-of-pavers/)  
81. Paver Patio Costs in 2025: Understanding Material, Labor, and Installation Charges, acessado em julho 23, 2025, [https://www.installitdirect.com/pavers-cost/](https://www.installitdirect.com/pavers-cost/)  
82. How Much Does Flagstone Cost? \[2025 Data\] | Angi, acessado em julho 23, 2025, [https://www.angi.com/articles/what-are-common-flagstone-prices.htm](https://www.angi.com/articles/what-are-common-flagstone-prices.htm)  
83. Flagstone for Patios and Walkways Delivered in Atlanta \- Cummin Landscape Supply, acessado em julho 23, 2025, [https://www.cumminlandscapesupply.com/stone\_products/flagstone\_walkway](https://www.cumminlandscapesupply.com/stone_products/flagstone_walkway)  
84. Buy Timbers \- South Shore Landscape Supply, acessado em julho 23, 2025, [https://sslandscapesupply.com/product-tag/timbers/](https://sslandscapesupply.com/product-tag/timbers/)  
85. Landscape Ties | Landscape Timbers | StonewoodProducts.com, acessado em julho 23, 2025, [https://www.stonewoodproducts.com/product/landscape-ties/](https://www.stonewoodproducts.com/product/landscape-ties/)  
86. Landscape Timbers \- Walmart, acessado em julho 23, 2025, [https://www.walmart.com/c/kp/landscape-timbers](https://www.walmart.com/c/kp/landscape-timbers)  
87. How Much Does Landscape Edging Cost in 2025? \- LawnStarter, acessado em julho 23, 2025, [https://www.lawnstarter.com/blog/cost/landscape-edging-cost/](https://www.lawnstarter.com/blog/cost/landscape-edging-cost/)  
88. Annuals \- excluding fall annuals – Deneweth's Garden Center, acessado em julho 23, 2025, [https://deneweths.com/collections/flowers](https://deneweths.com/collections/flowers)  
89. Color Prices \- Sunshine Growers Nursery, acessado em julho 23, 2025, [https://sunshinegrowersnursery.com/color-prices/](https://sunshinegrowersnursery.com/color-prices/)  
90. Containers & Pricing \- Derby Canyon Natives, acessado em julho 23, 2025, [https://derbycanyonnatives.com/pricing/](https://derbycanyonnatives.com/pricing/)  
91. 2025 Sod Prices | Grass Cost Per Pallet, Square Foot & Roll, acessado em julho 23, 2025, [https://homeguide.com/costs/sod-prices](https://homeguide.com/costs/sod-prices)  
92. Order Sod Online: Pallet of Kentucky Bluegrass \- Debucks Sod Farm MI., acessado em julho 23, 2025, [https://debucksodfarm.com/shop/pallet-kentucky-bluegrass-sod-700-sq-ft-loaded-on-a-pallet/](https://debucksodfarm.com/shop/pallet-kentucky-bluegrass-sod-700-sq-ft-loaded-on-a-pallet/)  
93. Sod Rolls \- Sod \- The Home Depot, acessado em julho 23, 2025, [https://www.homedepot.com/b/Outdoors-Garden-Center-Landscaping-Supplies-Sod/Sod-Rolls/N-5yc1vZc8wlZ1z1povf](https://www.homedepot.com/b/Outdoors-Garden-Center-Landscaping-Supplies-Sod/Sod-Rolls/N-5yc1vZc8wlZ1z1povf)  
94. Grass Seed at Tractor Supply Co., acessado em julho 23, 2025, [https://www.tractorsupply.com/tsc/catalog/grass-seed](https://www.tractorsupply.com/tsc/catalog/grass-seed)  
95. Wholesale \- Grass Seed \- Contractors Choice \- 5lbs \- 50lbs | The Grove Firewood and Mulch, acessado em julho 23, 2025, [https://thegrovefm.com/product/wholesale-grass-seed-contractors-choice-5lbs-50lbs/](https://thegrovefm.com/product/wholesale-grass-seed-contractors-choice-5lbs-50lbs/)  
96. Grass Seed at Lowes.com, acessado em julho 23, 2025, [https://www.lowes.com/pl/lawn-care/grass-grass-seed/grass-seed/2810275700678](https://www.lowes.com/pl/lawn-care/grass-grass-seed/grass-seed/2810275700678)  
97. Grass Seed \- The Home Depot, acessado em julho 23, 2025, [https://www.homedepot.com/b/Outdoors-Garden-Center-Lawn-Care-Grass-Seed/N-5yc1vZbx62](https://www.homedepot.com/b/Outdoors-Garden-Center-Lawn-Care-Grass-Seed/N-5yc1vZbx62)  
98. Buy Lawn Fertilizers Online | Golf Course Lawn Store, acessado em julho 23, 2025, [https://golfcourselawn.store/collections/lawn-fertilizers](https://golfcourselawn.store/collections/lawn-fertilizers)  
99. Lawn Fertilizers \- The Home Depot, acessado em julho 23, 2025, [https://www.homedepot.com/b/Outdoors-Garden-Center-Lawn-Care-Lawn-Fertilizers/N-5yc1vZbx6b](https://www.homedepot.com/b/Outdoors-Garden-Center-Lawn-Care-Lawn-Fertilizers/N-5yc1vZbx6b)  
100. Weed Killer, Herbicide, Defoliant, Grass & Lawn Control \- Agri Supply, acessado em julho 23, 2025, [https://www.agrisupply.com/herbicides-weed-control/c/2600024/](https://www.agrisupply.com/herbicides-weed-control/c/2600024/)  
101. Lawn Care Chemicals – Turfco Grass Co, Inc, acessado em julho 23, 2025, [https://turfcograssfarms.com/collections/lawn-chemicals](https://turfcograssfarms.com/collections/lawn-chemicals)  
102. Lawn Irrigation System Parts & Supplies | Sprinkler Warehouse, acessado em julho 23, 2025, [https://www.sprinklerwarehouse.com/product/lawn-irrigation](https://www.sprinklerwarehouse.com/product/lawn-irrigation)  
103. Shop Sprinkler Valves \- Rain Bird, acessado em julho 23, 2025, [https://store.rainbird.com/valves/sprinkler-valves.html](https://store.rainbird.com/valves/sprinkler-valves.html)  
104. Valves for Sprinklers, acessado em julho 23, 2025, [https://www.sprinklerwarehouse.com/product/lawn-irrigation/valves](https://www.sprinklerwarehouse.com/product/lawn-irrigation/valves)  
105. Sprinkler Timers & Controllers for Irrigation, acessado em julho 23, 2025, [https://www.sprinklerwarehouse.com/product/lawn-irrigation/controllers-timers](https://www.sprinklerwarehouse.com/product/lawn-irrigation/controllers-timers)  
106. Tree Weed Barrier \- Walmart, acessado em julho 23, 2025, [https://www.walmart.com/c/kp/tree-weed-barrier](https://www.walmart.com/c/kp/tree-weed-barrier)  
107. Search stakes for weed fabric | VEVOR US, acessado em julho 23, 2025, [https://www.vevor.com/s/stakes-for-weed-fabric](https://www.vevor.com/s/stakes-for-weed-fabric)  
108. Misc Landscaping Supplies \- Ward's Lumber, acessado em julho 23, 2025, [https://www.wardslumber.com/c/Lawn-and-Garden-1/Landscape-Supplies/Misc-Landscaping-Supplies/](https://www.wardslumber.com/c/Lawn-and-Garden-1/Landscape-Supplies/Misc-Landscaping-Supplies/)  
109. Tree Mats (3 ft x 3 ft) \- Weed Barrier, Farming, Gardening \- UV Protected \- Sandbaggy, acessado em julho 23, 2025, [https://sandbaggy.com/products/tree-mats](https://sandbaggy.com/products/tree-mats)  
110. Tree Wrap Archives \- All Seasons Covered, acessado em julho 23, 2025, [https://allseasonscovered.com/product-category/tree-care-protection/tree-wrap/](https://allseasonscovered.com/product-category/tree-care-protection/tree-wrap/)  
111. Landscape Supplies and Materials | SiteOne, acessado em julho 23, 2025, [https://www.siteone.com/en/landscape-supply/c/sh12](https://www.siteone.com/en/landscape-supply/c/sh12)