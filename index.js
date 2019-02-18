#!/usr/bin/env node
var program = require('commander');
var elfy = require('elfy');
var fs = require('fs');

program
    .arguments('<elf-path>')
    .option('-l, --ldscript <path>', 'The linker script the application was linked against')
    .option('-d, --details', 'Print extra details')
    .action(
        function(file)
        {
            if(!file)
                return console.error("Invalid file!");

            if(!program.ldscript)
                return console.error("Invalid linker script!");

            fs.readFile(
                file,
                function (err, elf_data)
                {
                    if(err)
                        return console.error("Error reading file!");

                    fs.readFile(
                        program.ldscript,
                        function (err, ld_data)
                        {
                            if(err)
                                return console.error("Error reading linker script!");

                            var mem_regex = /MEMORY\s+{[^\n]*([^}]*)}/g;
                            var match = mem_regex.exec(ld_data);

                            if(!match || !match[1])
                                return console.error("MEMORY section not found on linker script!");

                            var ld_mem = match[1];
                            var mem_sections = [];
                            var mem_section_regex = /\s*([^\s]+)\s*\(([rwx]*)\)\s*:\s*ORIGIN\s*=\s*0x([^,]*),\s*LENGTH\s*=\s*0x([^\s]*)/g;

                            while ((match = mem_section_regex.exec(ld_mem)) !== null)
                            {
                                mem_sections.push(
                                    {
                                        name: match[1],
                                        allowed_operations: match[2],
                                        start: parseInt(match[3], 16),
                                        size: parseInt(match[4], 16),
                                        used_size: 0,
                                        elf_sections: []
                                    }
                                );
                            }

                            if(!mem_sections.length)
                                return console.error("No memory sections found on linker script!");

                            var elf = elfy.parse(elf_data);

                            elf.body.sections.forEach(
                                function (section)
                                {
                                    if(!section || !section.name || !section.size || !section.flags.alloc || section.type == "nobits")
                                        return;

                                    for(var i = 0; i < mem_sections.length; i++)
                                    {
                                        if(section.addr < mem_sections[i].start || section.addr >= mem_sections[i].start + mem_sections[i].size)
                                            continue;

                                        mem_sections[i].used_size += section.size;
                                        mem_sections[i].elf_sections.push(section);
                                    }
                                }
                            );

                            mem_sections.forEach(
                                function (section)
                                {
                                    if(program.details === undefined)
                                        return console.log("Section '%s' usage: %f%% (%d/%d bytes)", section.name, (section.used_size * 100 / section.size).toFixed(2), section.used_size, section.size);

                                    console.log("Section '%s':", section.name);
                                    console.log("  Start address: %s", hexpad(section.start, 8));
                                    console.log("  End address: %s", !section.size ? hexpad(section.start, 8) : hexpad(section.start + section.size - 1, 8));
                                    console.log("  Permissions: %s", section.allowed_operations);
                                    console.log("  Total usage: %f%% (%d/%d bytes)", !section.size ? 0 : (section.used_size * 100 / section.size).toFixed(2), section.used_size, section.size);

                                    section.elf_sections.forEach(
                                        function (elf_section)
                                        {
                                            console.log("  Sub-section '%s': %f%% (%d/%d bytes)", elf_section.name, (elf_section.size * 100 / section.size).toFixed(2), elf_section.size, section.size);
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    )
    .parse(process.argv);


function hexpad(number, length)
{
    var str = number.toString(16).toUpperCase();

    while (str.length < length)
        str = '0' + str;

    return "0x" + str;
}
