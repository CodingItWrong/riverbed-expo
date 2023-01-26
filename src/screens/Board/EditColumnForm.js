import {useQuery} from '@tanstack/react-query';
import set from 'lodash.set';
import {useState} from 'react';
import {StyleSheet} from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Dropdown from '../../components/Dropdown';
import Text from '../../components/Text';
import TextField from '../../components/TextField';
import {useElements} from '../../data/elements';
import ELEMENT_TYPES from '../../enums/elementTypes';
import QUERIES from '../../enums/queries';
import SORT_DIRECTIONS from '../../enums/sortDirections';

export default function EditColumnForm({
  column,
  board,
  onSave,
  onDelete,
  onCancel,
}) {
  const [attributes, setAttributes] = useState(column.attributes);

  function updateAttribute(path, value) {
    setAttributes(oldAttributes => {
      const newAttributes = {...oldAttributes};
      set(newAttributes, path, value);
      return newAttributes;
    });
  }

  function handleSave() {
    onSave(attributes);
  }

  return (
    <Card>
      <TextField
        label="Column Name"
        value={attributes.name ?? ''}
        onChangeText={value => updateAttribute('name', value)}
        testID="text-input-column-name"
      />
      <CardInclusionCondition
        board={board}
        attributes={attributes}
        updateAttribute={updateAttribute}
      />
      <ColumnSortOrder
        board={board}
        attributes={attributes}
        updateAttribute={updateAttribute}
      />
      <Button onPress={onCancel} style={styles.button}>
        Cancel
      </Button>
      <Button onPress={onDelete} style={styles.button}>
        Delete Column
      </Button>
      <Button onPress={handleSave} style={styles.button}>
        Save Column
      </Button>
    </Card>
  );
}

function CardInclusionCondition({board, attributes, updateAttribute}) {
  // TODO: extract custom hook
  const elementClient = useElements();
  const {data: elements = []} = useQuery(['elements', board.id], () =>
    elementClient.related({parent: board}).then(resp => resp.data),
  );
  const fields = elements.filter(
    e => e.attributes['element-type'] === ELEMENT_TYPES.FIELD,
  );

  const queryOptions = Object.values(QUERIES);

  return (
    <Card>
      <Text>Cards to Include</Text>
      <Dropdown
        fieldLabel="Show Query"
        emptyLabel="(choose)"
        options={queryOptions}
        value={queryOptions.find(
          query => query.key === attributes['card-inclusion-condition']?.query,
        )}
        onValueChange={query =>
          updateAttribute('card-inclusion-condition.query', query.key)
        }
        keyExtractor={query => query.key}
        labelExtractor={query => query.label}
        style={styles.field}
      />
      <Dropdown
        fieldLabel="Query Field"
        emptyLabel="(choose)"
        options={fields}
        value={fields.find(
          f => f.id === attributes['card-inclusion-condition']?.field,
        )}
        onValueChange={field =>
          updateAttribute('card-inclusion-condition.field', field.id)
        }
        keyExtractor={field => field.id}
        labelExtractor={field => field.attributes.name}
        style={styles.field}
      />
    </Card>
  );
}

function ColumnSortOrder({board, attributes, updateAttribute}) {
  const elementClient = useElements();
  const {data: elements = []} = useQuery(['elements', board.id], () =>
    elementClient.related({parent: board}).then(resp => resp.data),
  );
  const fields = elements.filter(
    e => e.attributes['element-type'] === ELEMENT_TYPES.FIELD,
  );

  const sortDirectionOptions = Object.values(SORT_DIRECTIONS);

  return (
    <Card>
      <Text>Sort Order</Text>
      <Dropdown
        fieldLabel="Sort Field"
        emptyLabel="(choose)"
        options={fields}
        value={fields.find(f => f.id === attributes.sort?.field)}
        onValueChange={field => updateAttribute('sort.field', field.id)}
        keyExtractor={field => field.id}
        labelExtractor={field => `By ${field.attributes.name}`}
        style={styles.field}
      />
      <Dropdown
        fieldLabel="Sort Direction"
        emptyLabel="(choose)"
        options={sortDirectionOptions}
        value={sortDirectionOptions.find(
          direction => direction.key === attributes.sort?.direction,
        )}
        onValueChange={direction =>
          updateAttribute('sort.direction', direction.key)
        }
        keyExtractor={direction => direction.key}
        labelExtractor={direction => direction.label}
        style={styles.field}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
  },
});
