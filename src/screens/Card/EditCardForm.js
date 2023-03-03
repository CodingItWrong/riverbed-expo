import debounce from 'lodash.debounce';
import {useCallback, useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import ButtonElement from '../../components/ButtonElement';
import ButtonMenuElement from '../../components/ButtonMenuElement';
import ErrorMessage from '../../components/ErrorMessage';
import Field from '../../components/Field';
import Text from '../../components/Text';
import sharedStyles from '../../components/sharedStyles';
import {useUpdateCard} from '../../data/cards';
import {useBoardElements} from '../../data/elements';
import COMMANDS from '../../enums/commands';
import ELEMENT_TYPES from '../../enums/elementTypes';
import VALUES from '../../enums/values';
import useWebRefreshGuard from '../../hooks/useWebRefreshGuard';
import checkConditions from '../../utils/checkConditions';
import dateUtils from '../../utils/dateUtils';
import sortByDisplayOrder from '../../utils/sortByDisplayOrder';

// NOTE: cypress time needs to be long enough to prevent multiple saves at cypress's speed
// could end up flaky
const SAVE_DEBOUNCE_TIME = window.Cypress ? 100 : 300;

const debounceSave = debounce(
  handleUpdateCard => handleUpdateCard(),
  SAVE_DEBOUNCE_TIME,
);

export default function EditCardForm({card, board, onClose}) {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const [isChanged, setIsChanged] = useState(false);
  const [fieldValues, setFieldValues] = useState(
    card.attributes['field-values'],
  );

  useWebRefreshGuard(isChanged);

  // every time field values change, schedule a debounced run of the update
  useEffect(() => {
    if (isChanged) {
      debounceSave(handleUpdateCard);
    }
    // TODO: fieldValues shouldn't be needed here, but there seems to be a dependency issue with handleUpdateCard; not properly recreated for new fiedValues
  }, [fieldValues, isChanged, handleUpdateCard]);

  const {data: elements = []} = useBoardElements(board);

  const elementsToShow = sortByDisplayOrder(
    elements.filter(element =>
      checkConditions({
        fieldValues,
        conditions: [element.attributes['show-condition']],
        elements,
      }),
    ),
  );

  function setFieldValue(fieldId, value) {
    setFieldValues(oldValues => ({...oldValues, [fieldId]: value}));
    setIsChanged(true);
  }

  function handlePerformActions(actions) {
    const updatedAttributes = Object.assign(
      {},
      ...actions.map(action => performAction(action)),
    );
    handleUpdateCard(updatedAttributes, {onSuccess: onClose});
  }

  function performAction(action) {
    const {command, field, value} = action;

    const fieldObject = elements.find(element => element.id === field);

    switch (command) {
      case COMMANDS.SET_VALUE.key:
        const valueObject = Object.values(VALUES).find(v => v.key === value);
        if (valueObject) {
          const concreteValue = valueObject.call(
            fieldObject.attributes['data-type'],
          );
          return {[field]: concreteValue};
        } else {
          console.error(`unknown value: ${value}`);
          return;
        }
      case COMMANDS.ADD_DAYS.key:
        // TODO: handle datetime
        function getStartDate() {
          const now = new Date();
          const fieldDate = dateUtils.serverStringToObject(fieldValues[field]);
          if (fieldDate && fieldDate >= now) {
            return fieldDate;
          } else {
            return now;
          }
        }
        const startDate = getStartDate();
        const updatedDate = dateUtils.addDays(startDate, Number(value));
        const concreteValue = dateUtils.objectToServerString(updatedDate);
        return {[field]: concreteValue};
      default:
        console.error(`unknown command: ${command}`);
    }
  }

  const {mutate: updateCard, isError: isUpdateError} = useUpdateCard(
    card,
    board,
    mounted,
  );
  const handleUpdateCard = useCallback(
    (fieldOverrides, options) => {
      const fieldValuesToUse = {...fieldValues, ...fieldOverrides};
      updateCard({'field-values': fieldValuesToUse}, options);
      setIsChanged(false);
    },
    [updateCard, fieldValues],
  );

  function getErrorMessage() {
    if (isUpdateError) {
      return 'An error occurred while saving the card';
    }
  }

  return (
    <View>
      <ErrorMessage>{getErrorMessage()}</ErrorMessage>
      {elementsToShow.map((element, elementIndex) => {
        switch (element.attributes['element-type']) {
          case ELEMENT_TYPES.FIELD.key:
            return (
              <View key={element.id} testID={`element-${element.id}`}>
                <Field
                  field={element}
                  value={fieldValues[element.id]}
                  setValue={value => setFieldValue(element.id, value)}
                  readOnly={element.attributes['read-only']}
                  style={elementIndex > 0 && sharedStyles.mt}
                />
              </View>
            );
          case ELEMENT_TYPES.BUTTON.key:
            return (
              <ButtonElement
                key={element.id}
                element={element}
                onPerformAction={() =>
                  handlePerformActions(element.attributes.options.actions)
                }
                style={elementIndex > 0 && sharedStyles.mt}
              />
            );
          case ELEMENT_TYPES.BUTTON_MENU.key:
            return (
              <ButtonMenuElement
                key={element.id}
                element={element}
                onPerformActionForItem={menuItem =>
                  handlePerformActions(menuItem.actions)
                }
                style={elementIndex > 0 && sharedStyles.mt}
              />
            );
          default:
            return (
              <Text>
                unknown element type: {element.attributes['element-type']}
              </Text>
            );
        }
      })}
    </View>
  );
}
