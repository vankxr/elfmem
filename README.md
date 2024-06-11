# elfmem

Takes an ELF and a Linker Script as input and prints informations about the memory usage. Tested on ARM, ESP8266 (xtensa) and RISC-V ELF files

## Installation guide
You can grab the binary file from the releases page, or the .deb package which is just a commodity installer for the binary file.
If you have NodeJS installed and want to install globally with npm
```
git clone https://github.com/vankxr/elfmem
cd elfmem
npm i -g
```

## Usage
```
# elfmem --help
Usage: elfmem [options] <elf-path>

Options:
  -l, --ldscript <path>     The linker script the application was linked against
  -d, --details             Print extra details
  -h, --humanify            Print human readable sizes
  -e, --exclude <sections>  Comma-separated list of sections to exclude
  -i, --include <sections>  Comma-separated list of sections to include
  -z, --exclude-empty       Exclude empty sections
  -h, --help                output usage information
```

### Example output
```
# elfmem -l ./linker-script.ld -d -h ./target-elf-file.elf
Section 'irom0':
  Start address: 0x00000000
  End address: 0x007FFFFF
  Permissions: rx
  Total usage: 0.11% (9.30 KiB/8.00 MiB)
    Sub-section '.irom0.text': 0.11% (9.17 KiB)
    Sub-section '.riscv.attributes': 0% (47.00 B)
    Sub-section '.dram1.data': 0% (80.00 B)
Section 'iram0':
  Start address: 0x01000000
  End address: 0x0101DFFF
  Permissions: rwx
  Total usage: 0.31% (384.00 B/120.00 KiB)
    Sub-section '.iram0.text': 0.31% (384.00 B)
Section 'dram0':
  Start address: 0x0101E000
  End address: 0x0101FFFF
  Permissions: rw
  Total usage: 0% (0.00 B/8.00 KiB)
Section 'dram1':
  Start address: 0x20000000
  End address: 0x3FFFFFFF
  Permissions: rw
  Total usage: 0% (92.00 B/512.00 MiB)
    Sub-section '.dram1.data': 0% (80.00 B)
    Sub-section '.bss': 0% (12.00 B)
```
