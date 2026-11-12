import { Checkbox, Flex, Form, Input, InputNumber, Radio, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';

interface Props {
  question: API.IQuestionnaireQuestion;
  number: string;
  onAnswer: (answer: API.TQuestionnaireAnswer | null) => Promise<void>;
}

export default ({ question, number, onAnswer }: Props) => {
  const form = Form.useFormInstance();

  const { t } = useTranslation('questionnaireAnswer');

  const options = question.options.map((label, value) => ({ label, value }));

  const renderInput = () => {
    switch (question.type) {
      case 'SINGLE':
        return (
          <Radio.Group
            orientation="vertical"
            options={options}
            onChange={(event) => onAnswer(event.target.value)}
          />
        );
      case 'MULTIPLE':
        return (
          <Checkbox.Group<number>
            options={options}
            className={styles.choices}
            onChange={(values) => onAnswer(values.length ? values : null)}
          />
        );
      case 'TEXT':
        return (
          <Input.TextArea
            rows={3}
            onBlur={(event) => {
              if (!form.isFieldTouched(question.uuid)) return;
              const value = event.currentTarget.value;
              onAnswer(value.trim() ? value : null);
            }}
          />
        );
      case 'NUMBER':
        return (
          <InputNumber
            onBlur={() => {
              const value = form.getFieldValue(question.uuid);
              if (value === null || (typeof value === 'number' && Number.isFinite(value))) {
                onAnswer(value);
              }
            }}
          />
        );
    }
  };

  return (
    <Form.Item
      name={question.uuid}
      initialValue={question.answer}
      className={styles.answerItem}
      label={
        <Flex vertical gap="small" component="span">
          {t('question', { number, title: question.title })}
          {question.description?.trim() && (
            <Typography.Text type="secondary">{question.description}</Typography.Text>
          )}
        </Flex>
      }
    >
      {renderInput()}
    </Form.Item>
  );
};
