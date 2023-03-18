import set from 'lodash.set';
import {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import DropdownField from '../../../components/DropdownField';
import ErrorMessage from '../../../components/ErrorMessage';
import Field from '../../../components/Field';
import FormGroup from '../../../components/FormGroup';
import IconButton from '../../../components/IconButton';
import NumberField from '../../../components/NumberField';
import TextField from '../../../components/TextField';
import sharedStyles from '../../../components/sharedStyles';
import {useDeleteColumn, useUpdateColumn} from '../../../data/columns';
import {useBoardElements} from '../../../data/elements';
import ELEMENT_TYPES from '../../../enums/elementTypes';
import QUERIES from '../../../enums/queries';
import SORT_DIRECTIONS from '../../../enums/sortDirections';
import SUMMARY_FUNCTIONS from '../../../enums/summaryFunctions';

export default function EditColumnForm({
  column,
  board,
  onChange,
  onCancel,
  style,
}) {
  const insets = useSafeAreaInsets();
  const [attributes, setAttributes] = useState(column.attributes);

  const {data: elements = []} = useBoardElements(board);
  const fields = elements.filter(
    e => e.attributes['element-type'] === ELEMENT_TYPES.FIELD.key,
  );

  function updateAttribute(path, value) {
    setAttributes(oldAttributes => {
      const newAttributes = {...oldAttributes};
      set(newAttributes, path, value);
      return newAttributes;
    });
  }

  const {
    mutate: updateColumn,
    isLoading: isSaving,
    isError: isUpdateError,
  } = useUpdateColumn(column, board);
  const handleUpdateColumn = () =>
    updateColumn(attributes, {onSuccess: onChange});

  const {
    mutate: deleteColumn,
    isLoading: isDeleting,
    isError: isDeleteError,
  } = useDeleteColumn(column, board);
  const handleDeleteColumn = () => deleteColumn(null, {onSuccess: onChange});

  const isLoading = isSaving || isDeleting;

  function getErrorMessage() {
    if (isUpdateError) {
      return 'An error occurred while saving the column';
    } else if (isDeleteError) {
      return 'An error occurred while deleting the column';
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        sharedStyles.columnPadding,
        {paddingBottom: insets.bottom},
      ]}
      scrollIndicatorInsets={{bottom: insets.bottom}}
    >
      <Card style={style}>
        <TextField
          label="Column Name"
          value={attributes.name ?? ''}
          onChangeText={value => updateAttribute('name', value)}
          testID="text-input-column-name"
        />
        <NumberField
          keyboard-type="number-pad"
          label="Order"
          value={
            attributes['display-order'] == null
              ? ''
              : String(attributes['display-order'])
          }
          onChangeText={value =>
            updateAttribute(
              'display-order',
              value === '' ? null : Number(value),
            )
          }
          testID="number-input-order"
        />
        <CardInclusionCondition
          board={board}
          fields={fields}
          attributes={attributes}
          updateAttribute={updateAttribute}
        />
        <ColumnSortOrder
          board={board}
          fields={fields}
          attributes={attributes}
          updateAttribute={updateAttribute}
        />
        <ColumnGrouping
          board={board}
          fields={fields}
          attributes={attributes}
          updateAttribute={updateAttribute}
        />
        <ColumnSummary
          board={board}
          fields={fields}
          attributes={attributes}
          updateAttribute={updateAttribute}
        />
        <ErrorMessage>{getErrorMessage()}</ErrorMessage>
        <Button onPress={onCancel} disabled={isLoading} style={sharedStyles.mt}>
          Cancel
        </Button>
        <Button
          onPress={handleDeleteColumn}
          disabled={isLoading}
          style={sharedStyles.mt}
        >
          Delete Column
        </Button>
        <Button
          mode="primary"
          onPress={handleUpdateColumn}
          disabled={isLoading}
          style={sharedStyles.mt}
        >
          Save Column
        </Button>
      </Card>
    </ScrollView>
  );
}

function CardInclusionCondition({board, fields, attributes, updateAttribute}) {
  const queryOptions = Object.values(QUERIES);
  const conditions = attributes['card-inclusion-conditions'] ?? [];

  function addCondition() {
    updateAttribute('card-inclusion-conditions', [...conditions, {}]);
  }

  function removeConditionAtIndex(index) {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    updateAttribute('card-inclusion-conditions', newConditions);
  }

  // TODO:
  // - test removing a filter
  // - refactor visuals incl field names
  return (
    <FormGroup title="Cards to Include">
      {conditions.map((condition, index) => (
        <View key={`condition-${index}`} style={styles.conditionRow}>
          <View style={styles.concreteFieldWrapper}>
            <View style={[styles.conditionElements, sharedStyles.mt]}>
              <DropdownField
                fieldLabel={null}
                emptyLabel="(field)"
                options={fields}
                value={fields.find(f => f.id === condition.field)}
                onValueChange={field =>
                  updateAttribute(
                    `card-inclusion-conditions[${index}].field`,
                    field?.id,
                  )
                }
                keyExtractor={field => field.id}
                labelExtractor={field => field.attributes.name}
                style={styles.conditionButton}
              />
              <DropdownField
                fieldLabel={null}
                emptyLabel="(condition)"
                options={queryOptions}
                value={queryOptions.find(
                  query => query.key === condition.query,
                )}
                onValueChange={query =>
                  updateAttribute(
                    `card-inclusion-conditions[${index}].query`,
                    query?.key,
                  )
                }
                keyExtractor={query => query.key}
                labelExtractor={query => query.label}
                style={styles.conditionButton}
              />
            </View>
            {queryOptions.find(query => query.key === condition.query)
              ?.showConcreteValueField &&
              condition.field && (
                <Field
                  field={fields.find(f => f.id === condition.field)}
                  value={condition.options?.value}
                  setValue={v =>
                    updateAttribute(
                      `card-inclusion-conditions[${index}].options.value`,
                      v,
                    )
                  }
                  style={sharedStyles.mt}
                />
              )}
          </View>
          <IconButton
            icon="close-circle"
            accessibilityLabel="Remove condition"
            onPress={() => removeConditionAtIndex(index)}
          />
        </View>
      ))}
      <Button
        icon="plus"
        mode="link"
        onPress={addCondition}
        style={sharedStyles.mt}
      >
        Add Filter
      </Button>
    </FormGroup>
  );
}

function ColumnSortOrder({board, fields, attributes, updateAttribute}) {
  const sortDirectionOptions = Object.values(SORT_DIRECTIONS);

  return (
    <FormGroup title="Sort Order">
      <DropdownField
        fieldLabel="Sort Field"
        emptyLabel="(choose)"
        options={fields}
        value={fields.find(f => f.id === attributes['card-sort-order']?.field)}
        onValueChange={field =>
          updateAttribute('card-sort-order.field', field?.id)
        }
        keyExtractor={field => field.id}
        labelExtractor={field => field.attributes.name}
        style={sharedStyles.mt}
      />
      <DropdownField
        fieldLabel="Sort Direction"
        emptyLabel="(choose)"
        options={sortDirectionOptions}
        value={sortDirectionOptions.find(
          direction =>
            direction.key === attributes['card-sort-order']?.direction,
        )}
        onValueChange={direction =>
          updateAttribute('card-sort-order.direction', direction?.key)
        }
        keyExtractor={direction => direction.key}
        labelExtractor={direction => direction.label}
        style={sharedStyles.mt}
      />
    </FormGroup>
  );
}

function ColumnGrouping({board, fields, attributes, updateAttribute}) {
  const sortDirectionOptions = Object.values(SORT_DIRECTIONS);

  return (
    <FormGroup title="Grouping">
      <DropdownField
        fieldLabel="Group Field"
        emptyLabel="(choose)"
        options={fields}
        value={fields.find(f => f.id === attributes['card-grouping']?.field)}
        onValueChange={field =>
          updateAttribute('card-grouping.field', field?.id)
        }
        keyExtractor={field => field.id}
        labelExtractor={field => field.attributes.name}
        style={sharedStyles.mt}
      />
      <DropdownField
        fieldLabel="Group Direction"
        emptyLabel="(choose)"
        options={sortDirectionOptions}
        value={sortDirectionOptions.find(
          direction => direction.key === attributes['card-grouping']?.direction,
        )}
        onValueChange={direction =>
          updateAttribute('card-grouping.direction', direction?.key)
        }
        keyExtractor={direction => direction.key}
        labelExtractor={direction => direction.label}
        style={sharedStyles.mt}
      />
    </FormGroup>
  );
}

function ColumnSummary({board, fields, attributes, updateAttribute}) {
  const summaryFunctionOptions = Object.values(SUMMARY_FUNCTIONS);

  return (
    <FormGroup title="Summary">
      <DropdownField
        fieldLabel="Summary Function"
        emptyLabel="(choose)"
        options={summaryFunctionOptions}
        value={summaryFunctionOptions.find(
          o => o.key === attributes.summary?.function,
        )}
        onValueChange={o => updateAttribute('summary.function', o?.key)}
        keyExtractor={o => o.key}
        labelExtractor={o => o.label}
        style={sharedStyles.mt}
      />
      {attributes.summary?.function === SUMMARY_FUNCTIONS.SUM.key && (
        <DropdownField
          fieldLabel="Summary Field"
          emptyLabel="(choose)"
          options={fields}
          value={fields.find(f => f.id === attributes.summary?.options?.field)}
          onValueChange={field =>
            updateAttribute('summary.options.field', field?.id)
          }
          keyExtractor={field => field.id}
          labelExtractor={field => field.attributes.name}
          style={sharedStyles.mt}
        />
      )}
    </FormGroup>
  );
}

const styles = StyleSheet.create({
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  conditionElements: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  conditionButton: {
    marginRight: 8,
  },
  concreteFieldWrapper: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});
