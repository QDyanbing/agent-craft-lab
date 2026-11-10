import AddButton from '@/components/AddButton';
import { MinusCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useCreate from '../../hooks/question/useCreate';
import useModify from '../../hooks/question/useModify';
import useEditor from '../../models/useEditor';

interface FormValues {
  type: { value: API.QuestionnaireQuestionType; label: string };
  title: string;
  description?: string;
  options?: string[];
}

const QUESTION_TYPES: API.QuestionnaireQuestionType[] = ['single', 'multiple', 'text', 'number'];

export default ({ question }: { question?: API.QuestionnaireQuestion }) => {
  const { onClose } = useEditor.getState();

  const { loading: creating, onCreate } = useCreate();
  const { loading: modifying, onModify } = useModify();

  const [form] = Form.useForm<FormValues>();
  const selectedType = Form.useWatch('type', form);

  const { t } = useTranslation('questionnaireQuestions');

  const loading = creating || modifying;
  const type = selectedType?.value ?? question?.type ?? 'single';
  const hasOptions = type === 'single' || type === 'multiple';

  const onFinish = ({ type: { value }, title, description, options }: FormValues) => {
    const params: API.QuestionnaireQuestionSetParams =
      value === 'single' || value === 'multiple'
        ? { type: value, title, description, options: options ?? [] }
        : { type: value, title, description };

    return question ? onModify(params) : onCreate(params);
  };

  useEffect(() => {
    if (!question) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      type: { value: question.type, label: t(question.type) },
      title: question.title,
      description: question.description,
      options: question.options.length ? question.options : ['', ''],
    });
  }, [form, question, t]);

  return (
    <Modal
      open
      confirmLoading={loading}
      title={t(question ? 'editQuestion' : 'newQuestion')}
      okText={t('save')}
      onOk={() => form.submit()}
      onCancel={() => {
        if (!loading) onClose();
      }}
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{ type: { value: 'single', label: t('single') }, options: ['', ''] }}
        disabled={loading}
        onFinish={onFinish}
      >
        <Form.Item name="type" label={t('type')} rules={[{ required: true }]}>
          <Select
            labelInValue
            virtual={false}
            options={QUESTION_TYPES.map((value) => ({ value, label: t(value) }))}
          />
        </Form.Item>
        <Form.Item
          name="title"
          label={t('title')}
          rules={[{ required: true, whitespace: true, message: t('requireTitle') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        {hasOptions && (
          <Form.Item label={t('options')}>
            <Form.List
              name="options"
              rules={[
                {
                  validator: async (_, values: string[]) => {
                    if (!values?.length) throw new Error(t('requireOptions'));
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <Flex vertical gap="small">
                  {fields.map(({ key, name }, index) => (
                    <Flex gap="small" align="baseline" key={key}>
                      <Flex vertical flex={1}>
                        <Form.Item
                          noStyle
                          name={name}
                          rules={[
                            { required: true, whitespace: true, message: t('requireOption') },
                          ]}
                        >
                          <Input
                            aria-label={t('option', { n: index + 1 })}
                            placeholder={t('option', { n: index + 1 })}
                          />
                        </Form.Item>
                      </Flex>
                      <Button
                        type="text"
                        aria-label={t('removeOption', { n: index + 1 })}
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Flex>
                  ))}
                  <AddButton label={t('addOption')} onClick={() => add('')} />
                  <Form.ErrorList errors={errors} />
                </Flex>
              )}
            </Form.List>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
