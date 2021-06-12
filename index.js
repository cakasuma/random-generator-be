const fs = require('fs');
const path = require('path');

const generateAlphabets = () => 'abcdefghijklmnopqrstuvwxyz'; // only 30 bytes

const generateNumerics = () => '0123456789';

const commonIntegerRandomGenerator = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const commonNumberRandomGenerator = (min, max) => {
    let result = 0;
    const random_number = Math.random() * (max - min + 1) + min;
    if (random_number > max) result = max; // to make max inclusive

    result = random_number;

    return result;
};

const alphabeticalRandomGenerator = (result_text_length) => {
    let result = '';
    const source_string = generateAlphabets();

    for (let i = 0; i < result_text_length; i++) {
        result +=
            source_string[
                commonIntegerRandomGenerator(0, source_string.length - 1)
            ]; // -1 because we are targeting index
    }

    return result;
};

const integerRandomGenerator = (result_text_length) => {
    // TODO: test number out of boundary
    const min_number = 10 ** result_text_length;
    const max_number = 10 ** (result_text_length + 1) - 1;
    const result = commonIntegerRandomGenerator(min_number, max_number);

    return result;
};

const numberRandomGenerator = (result_text_length) => {
    // max is 16 digit precision
    // TODO: test number out of boundary
    const max_number = 10 ** (result_text_length + 1) - 1;
    const result_with_precisions = commonNumberRandomGenerator(0, max_number);
    const result_without_precision = result_with_precisions.toFixed(0);
    const result_without_precision_length =
        result_without_precision.toString().length;
    let normalized_text = '';

    // txl 5, 716.34567654345
    if (result_without_precision_length < result_text_length) {
        const expected_result_difference =
            result_text_length - result_without_precision_length;
        normalized_text = result_with_precisions.toFixed(
            expected_result_difference
        ).toString();
    } else {
        normalized_text = result_with_precisions
            .toString()
            .substring(0, result_text_length);
    }

    const result = Number(normalized_text); // xx. -> xx

    return result;
};

const alphanumericRandomGenerator = (result_text_length) => {
    const source_string = `${generateAlphabets()}${generateNumerics()}`;
    let result = '';

    for (let i = 0; i < result_text_length; i++) {
        result +=
            source_string[
                commonIntegerRandomGenerator(0, source_string.length - 1)
            ]; // -1 because we are targeting index
    }

    return result;
};

const randomTextGenerator = (length_limit, fixed_length) => {
    let result_text = '';
    let result_type = '';
    const result_text_type = [
        'alphabetical',
        'number',
        'integer',
        'alphanumeric',
    ];

    const selected_text_type =
        result_text_type[
            commonIntegerRandomGenerator(0, result_text_type.length - 1)
        ]; // 0 -> 3 (text type index)
    const result_text_length =
        fixed_length || commonIntegerRandomGenerator(3, length_limit);

    switch (selected_text_type) {
        case result_text_type[0]:
            result_text = alphabeticalRandomGenerator(result_text_length);
            result_type = result_text_type[0]
            break;
        case result_text_type[1]:
            result_text = numberRandomGenerator(result_text_length);
            result_type = result_text_type[1]
            break;
        case result_text_type[2]:
            result_text = integerRandomGenerator(result_text_length);
            result_type = result_text_type[2]
            break;
        case result_text_type[3]:
            result_text = alphanumericRandomGenerator(result_text_length);
            result_type = result_text_type[3]
            break;
        default:
            result_text = alphanumericRandomGenerator(result_text_length); // default to alphanumeric
            result_type = result_text_type[3]
            break;
    }

    return [result_text, result_type];
};

const main = () => {
    console.time('test');
    // check if file persist
    const directory_name = 'data';
    const file_name = alphanumericRandomGenerator(16);
    const full_path = path.join(directory_name, file_name);
    const size_limit = 1024 * 1024 * 2; // 2MB
    const each_text_length_limit = 8;
    const separator = ',';
    const report = {}
    let all_text_generated = '';
    let file_reach_limit_size = false;

    // clean up previous files, can move somewhere else if multiple users
    try {
        const dir_files = fs.readdirSync(directory_name);
        for (const file of dir_files) {
            fs.unlinkSync(path.join(directory_name, file));
        }
    } catch (err) {
        console.error(err);
        console.timeEnd('test');
    }

    while (!file_reach_limit_size) {
        try {
            const [text_generated, text_generated_type] = randomTextGenerator(
                each_text_length_limit
            )
            let full_text_generated = `${text_generated}${separator}`;
            let full_text_generated_type = text_generated_type
            const stats = fs.statSync(full_path);
            const all_text_length_combined =
            full_text_generated.length + all_text_generated.length;

            if (stats.size >= size_limit) {
                file_reach_limit_size = true;
            } else {
                if (all_text_length_combined > size_limit) {
                    const text_difference = size_limit - all_text_generated.length;
                    const [text_generated_next, text_generated_type_next] = randomTextGenerator(null, text_difference);

                    full_text_generated = text_generated_next
                    full_text_generated_type = text_generated_type_next
                    console.log(full_text_generated_type)
                }
                
                fs.appendFileSync(full_path, full_text_generated);
                all_text_generated += full_text_generated

                if (!report[full_text_generated_type]) report[full_text_generated_type] = 0
                report[full_text_generated_type] += 1
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.writeFileSync(full_path, ''); // open empty file
            } else {
                file_reach_limit_size = true;
                console.error(err);
            }
        }
    }
    const stats = fs.statSync(full_path);
    console.log(stats.size);
    console.log(report)
    console.timeEnd('test');
};

main();
