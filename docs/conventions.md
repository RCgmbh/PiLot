# PiLot
## Conventions
Follow these basic principles when contributing code:
- **Simplicity**: The PiLot welcomes hobbyist programmers. Therefore, we want clear, easy to understand and simple code. If you make changes to an existing file, use the same conventions (naming, case sensitivity, brackets, new lines etc.).
- **Compatibility**: Also older devices should be usable as PiLot clients. Therefore, the entire web app needs to run on older standards. The benchmark is my waterproof PocketBook Aqua 2 and my dad's old iPad. Something around 2018 with Chrome 65, Firefox 52, Edge 14 should be supported.
- **Efficiency**: Bear in mind that the PiLot runs on low-end hardware. Reduce calculations, I/O access and the number of requests as much as possible. This might sometimes result in a slightly higher complexity (e. g. caching), but that's usually the way to go.
- **Dependencies** The PiLot uses a handful of libraries for the complicatd stuff, especially charts, maps and time. Furthermore, there are some jQuery leftovers, which should rather be eliminated than extended. If there is no extremely good reason, the introduction of new dependencies should be avoided. Vanilla first!
