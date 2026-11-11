import { Card, Checkbox, Flex, Form, Input, InputNumber, Radio, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';

type Answer = number | number[] | string;

interface Props {
  questionnaire: API.IQuestionnaireDetail;
  onAnswer: (module: string, question: string, answer: Answer) => Promise<void>;
}

const savedAnswers = (questionnaire: API.IQuestionnaireDetail) =>
  Object.fromEntries(
    questionnaire.modules.flatMap((module) =>
      module.questions.flatMap((question) =>
        question.answer == null ? [] : [[question.uuid, question.answer]],
      ),
    ),
  );

export default ({ questionnaire, onAnswer }: Props) => {
  const [form] = Form.useForm<Record<string, Answer>>();
  const { t } = useTranslation('questionnaireAnswer');

  return (
    <Form
      layout="vertical"
      form={form}
      className={styles.answerForm}
      initialValues={savedAnswers(questionnaire)}
    >
      {questionnaire.modules.map(
        (module, moduleIndex) =>
          module.questions.length > 0 && (
            <Card key={module.uuid}>
              <Flex vertical gap="middle" component="section" aria-label={module.name}>
                <Typography.Title level={3}>{module.name}</Typography.Title>
                {module.questions.map((question, index) => (
                  <Form.Item
                    key={question.uuid}
                    name={question.uuid}
                    label={
                      <Flex vertical gap="small" component="span">
                        {t('question', {
                          number: `${moduleIndex + 1}.${index + 1}`,
                          title: question.title,
                        })}
                        {question.description?.trim() && (
                          <Typography.Text type="secondary">{question.description}</Typography.Text>
                        )}
                      </Flex>
                    }
                  >
                    {question.type === 'TEXT' ? (
                      <Input.TextArea
                        rows={3}
                        onBlur={(event) => {
                          const value = event.currentTarget.value;
                          if (value.trim()) void onAnswer(module.uuid, question.uuid, value);
                        }}
                      />
                    ) : question.type === 'NUMBER' ? (
                      <InputNumber
                        onBlur={() => {
                          const value = form.getFieldValue(question.uuid);
                          if (typeof value === 'number' && Number.isFinite(value)) {
                            void onAnswer(module.uuid, question.uuid, value);
                          }
                        }}
                      />
                    ) : question.type === 'SINGLE' ? (
                      <Radio.Group
                        orientation="vertical"
                        options={question.options.map((label, value) => ({ label, value }))}
                        onChange={(event) => {
                          void onAnswer(module.uuid, question.uuid, event.target.value);
                        }}
                      />
                    ) : (
                      <Checkbox.Group
                        options={question.options.map((label, value) => ({ label, value }))}
                        className={styles.choices}
                        onChange={(value) => {
                          const selected = value.filter(
                            (item): item is number => typeof item === 'number',
                          );
                          if (selected.length) void onAnswer(module.uuid, question.uuid, selected);
                        }}
                      />
                    )}
                  </Form.Item>
                ))}
              </Flex>
            </Card>
          ),
      )}
    </Form>
  );
};
