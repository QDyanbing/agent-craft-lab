import { Button, Card, Checkbox, Flex, Form, Input, InputNumber, Radio, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';

type Answers = API.QuestionnaireResponseSetParams['answers'];

interface Props {
  survey: API.QuestionnaireDetail;
  loading: boolean;
  onCreate: (params: API.QuestionnaireResponseSetParams) => Promise<void>;
}

const renderInput = (question: API.QuestionnaireQuestion) => {
  switch (question.type) {
    case 'text':
      return <Input.TextArea rows={3} />;
    case 'number':
      return <InputNumber />;
    case 'single':
      return (
        <Radio.Group
          orientation="vertical"
          options={question.options.map((label, value) => ({ label, value }))}
        />
      );
    case 'multiple':
      return (
        <Checkbox.Group
          options={question.options.map((label, value) => ({ label, value }))}
          className={styles.choices}
        />
      );
  }
};

export default ({ survey, loading, onCreate }: Props) => {
  const [form] = Form.useForm<Answers>();

  const { t } = useTranslation('questionnaireAnswer');

  const [requestId] = useState(() => crypto.getRandomValues(new Uint32Array(4)).join('-'));

  const onFinish = (values: Answers) => {
    const answers = Object.fromEntries(
      Object.entries(values).filter(([, value]) => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return typeof value === 'number';
      }),
    );

    return onCreate({ requestId, revision: survey.revision, answers });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      disabled={loading}
      className={styles.answerForm}
      onFinish={onFinish}
    >
      {survey.modules.map(
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
                    {renderInput(question)}
                  </Form.Item>
                ))}
              </Flex>
            </Card>
          ),
      )}
      <Flex justify="end">
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          onClick={(event) => {
            event.preventDefault();
            form.submit();
          }}
        >
          {t('submit')}
        </Button>
      </Flex>
    </Form>
  );
};
