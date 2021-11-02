# armmem

Takes an ELF and a Linker Script as input and prints informations about the program

## Installation guide
You can grab the binary file from the releases page, or the .deb package which is just a commodity installer for the binary file.
If you have NodeJS installed and want to install globally with npm
```
git clone https://github.com/vankxr/armmem
cd armmem
npm i -g
```

## Usage
```
# armmem --help
Usage: armmem [options] <elf-path>

Options:
  -l, --ldscript <path>  The linker script the application was linked against
  -d, --details          Print extra details
  -h, --humanify         Print human readable sizes
  -h, --help             output usage information
```

### Example output
```
# armmem -l ./linker-script.ld -d -h ./target-elf-file.elf
Section 'irom0':
  Start address: 0x08000000
  End address: 0x08007FFF
  Permissions: rx
  Total usage: 0% (0.00 B/32.00 KB)
Section 'irom1':
  Start address: 0x08008000
  End address: 0x0803FFFF
  Permissions: rx
  Total usage: 46.77% (104.76 KB/224.00 KB)
  Sub-section '.isr_vector': 0.15% (336.00 B/224.00 KB)
  Sub-section '.text': 46.62% (104.43 KB/224.00 KB)
  Sub-section '.ARM': 0% (8.00 B/224.00 KB)
Section 'iram0':
  Start address: 0x20000000
  End address: 0x20001FFF
  Permissions: rwx
  Total usage: 0% (0.00 B/8.00 KB)
Section 'dram0':
  Start address: 0x20002000
  End address: 0x2000FFFF
  Permissions: rw
  Total usage: 1.05% (600.00 B/56.00 KB)
  Sub-section '.data': 1.05% (600.00 B/56.00 KB)
```
