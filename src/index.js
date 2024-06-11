#!/usr/bin/env node
const program = require('commander');
const elfy = require('elfy');
const fs = require('fs');

program
    .arguments('<elf-path>')
    .option('-l, --ldscript <path>', 'The linker script the application was linked against')
    .option('-d, --details', 'Print extra details')
    .option('-h, --humanify', 'Print human readable sizes')
    .option('-e, --exclude <sections>', 'Comma-separated list of sections to exclude', function (val) { return val.split(','); })
    .option('-i, --include <sections>', 'Comma-separated list of sections to include', function (val) { return val.split(','); })
    .option('-z, --exclude-empty', 'Exclude empty sections')
    .action(
        function(file)
        {
            if(!file)
                return console.error("Invalid file!");

            if(!program.ldscript)
                return console.error("Invalid linker script!");

            if(program.exclude && program.include)
                return console.error("Cannot use both include and exclude options!");

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

                            const mem_regex = /MEMORY\s+{[^\n]*([^}]*)}/g;
                            let match = mem_regex.exec(ld_data);

                            if(!match || !match[1])
                                return console.error("MEMORY section not found on linker script!");

                            const ld_mem = match[1];
                            let mem_sections = [];
                            const mem_section_regex = /\s*([^\s]+)\s*\(([rwx]*)\)\s*:\s*ORIGIN\s*=\s*0x([^,]*),\s*LENGTH\s*=\s*0x([^\s]*)/g;

                            while ((match = mem_section_regex.exec(ld_mem)) !== null)
                            {
                                const size = parseInt(match[4], 16);

                                if(!size)
                                    continue;

                                mem_sections.push(
                                    {
                                        name: match[1],
                                        allowed_operations: match[2],
                                        start: parseInt(match[3], 16),
                                        size: size,
                                        used_size: 0,
                                        elf_sections: []
                                    }
                                );
                            }

                            if(!mem_sections.length)
                                return console.error("No memory sections found on linker script!");

                            const elf = elfy.parse(elf_data);

                            elf.body.sections.forEach(
                                function (section)
                                {
                                    if(!section || !section.name)
                                        return;

                                    if(program.excludeEmpty && !section.size)
                                        return;

                                    if(program.exclude && program.exclude.includes(section.name))
                                        return;

                                    if(program.include && !program.include.includes(section.name))
                                        return;

                                    for(let i = 0; i < mem_sections.length; i++)
                                    {
                                        if(section.addr < mem_sections[i].start || section.addr + section.size > mem_sections[i].start + mem_sections[i].size)
                                            continue;

                                        mem_sections[i].used_size += section.size;
                                        mem_sections[i].elf_sections.push(section);
                                    }

                                    // Check if this section is expected to be loaded from a different section, and add it to the used size there
                                    elf.body.programs.forEach(
                                        function (program)
                                        {
                                            if(!program || !program.type || program.type != 'load' || program.vaddr == program.paddr || !program.memsz)
                                                return;

                                            if(section.addr < program.vaddr || section.addr + section.size > program.vaddr + program.memsz)
                                                return;

                                            for(let i = 0; i < mem_sections.length; i++)
                                            {
                                                if(program.paddr < mem_sections[i].start || program.paddr + section.size > mem_sections[i].start + mem_sections[i].size)
                                                    continue;

                                                mem_sections[i].used_size += section.size;
                                                mem_sections[i].elf_sections.push(section);
                                            }
                                        }
                                    );
                                }
                            );

                            mem_sections.forEach(
                                function (section)
                                {
                                    if(program.details === undefined)
                                        if(program.humanify)
                                            return console.log("Section '%s' usage: %f%% (%s/%s)", section.name, (section.used_size * 100 / section.size).toFixed(2), humanify_size(section.used_size), humanify_size(section.size));
                                        else
                                            return console.log("Section '%s' usage: %f%% (%d/%d bytes)", section.name, (section.used_size * 100 / section.size).toFixed(2), section.used_size, section.size);

                                    console.log("Section '%s':", section.name);
                                    console.log("  Start address: %s", hexpad(section.start, 8));
                                    console.log("  End address: %s", !section.size ? hexpad(section.start, 8) : hexpad(section.start + section.size - 1, 8));
                                    console.log("  Permissions: %s", section.allowed_operations);

                                    if(program.humanify)
                                        console.log("  Total usage: %f%% (%s/%s)", !section.size ? 0 : (section.used_size * 100 / section.size).toFixed(2), humanify_size(section.used_size), humanify_size(section.size));
                                    else
                                        console.log("  Total usage: %f%% (%d/%d bytes)", !section.size ? 0 : (section.used_size * 100 / section.size).toFixed(2), section.used_size, section.size);


                                    section.elf_sections.forEach(
                                        function (elf_section)
                                        {
                                            if(program.humanify)
                                                console.log("    Sub-section '%s': %f%% (%s)", elf_section.name, (elf_section.size * 100 / section.size).toFixed(2), humanify_size(elf_section.size));
                                            else
                                                console.log("    Sub-section '%s': %f%% (%d bytes)", elf_section.name, (elf_section.size * 100 / section.size).toFixed(2), elf_section.size);
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
    let str = number.toString(16).toUpperCase();

    while (str.length < length)
        str = '0' + str;

    return "0x" + str;
}

function humanify_size(size)
{
    const unit = ["B", "KiB", "MiB", "GiB", "TiB"];
    let i = 0;

    while(size > 1024 && i < 5)
    {
        size /= 1024;

        i++;
    }

    return size.toFixed(2) + " " + unit[i];
}
