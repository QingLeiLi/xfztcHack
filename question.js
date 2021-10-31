const inquirer = require('inquirer');

async function ask(question){
    if(!question){ return undefined; }
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'answer',
            message: question.question_content,
            choices: (question.options || []).map(opt => {
                return {
                    name: opt.question_option_content,
                    value: opt.question_option_id,
                };
            })
        }
    ]);
    return answers;
}

(async () => {
    const answers = await ask({
        question_content: '问题主体',
        options: [
            {
                question_option_id: '2',
                question_option_content: '答案1',
            }, {
                question_option_id: '7',
                question_option_content: '答案2',
            }, {
                question_option_id: '9',
                question_option_content: '答案3',
            },
        ],
    });
    console.log('answers:', answers);
})()

module.exports = ask;