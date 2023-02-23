import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {large, useBreakpoint} from '../../../breakpoints';
import Button from '../../../components/Button';
import LoadingIndicator from '../../../components/LoadingIndicator';
import sharedStyles, {useColumnStyle} from '../../../components/sharedStyles';
import {useCards, useCreateCard} from '../../../data/cards';
import {useColumns, useCreateColumn} from '../../../data/columns';
import {useBoardElements} from '../../../data/elements';
import ELEMENT_TYPES from '../../../enums/elementTypes';
import VALUES from '../../../enums/values';
import sortByDisplayOrder from '../../../utils/sortByDisplayOrder';
import Column from './Column';
import EditColumnForm from './EditColumnForm';

export default function ColumnList({board}) {
  const queryClient = useQueryClient();

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState(null);

  const {data: elements, isLoading: isLoadingElements} =
    useBoardElements(board);
  const {data: columns = [], isLoading: isLoadingColumns} = useColumns(board);
  const {isLoading: isLoadingCards} = useCards(board);

  const refreshCards = () => queryClient.invalidateQueries(['cards', board.id]);
  const refreshColumns = () =>
    queryClient.invalidateQueries(['columns', board.id]);

  const {mutate: createColumn, isLoading: isAddingColumn} =
    useCreateColumn(board);
  const handleCreateColumn = () =>
    createColumn(null, {
      onSuccess: ({data: column}) => {
        setSelectedColumnId(column.id);
        refreshColumns();
      },
    });

  function onChangeColumn() {
    refreshColumns();
    setSelectedColumnId(null);
  }

  const {mutate: createCard, isLoading: isAddingCard} = useCreateCard(board);
  const handleCreateCard = () =>
    createCard(
      {
        'field-values': getInitialFieldValues(elements),
      },
      {
        onSuccess: ({data: newCard}) => {
          setSelectedCardId(newCard.id);
          refreshCards();
        },
      },
    );

  function onChangeCard() {
    refreshCards();
    hideDetail();
  }

  function showDetail(cardId) {
    setSelectedCardId(cardId);
  }

  function hideDetail() {
    setSelectedCardId(null);
  }

  const breakpoint = useBreakpoint();
  const responsiveButtonContainerStyle = {
    alignItems: breakpoint === large ? 'flex-start' : 'stretch',
  };
  const columnWidthStyle = useColumnStyle();

  const isLoading = isLoadingCards || isLoadingColumns || isLoadingElements;
  if (isLoading) {
    return (
      <View style={columnWidthStyle}>
        <LoadingIndicator />
      </View>
    );
  }

  const sortedColumns = sortByDisplayOrder(columns);

  return (
    <View style={sharedStyles.fullHeight}>
      <View style={[styles.buttonContainer, responsiveButtonContainerStyle]}>
        <Button
          mode="link"
          icon="plus"
          onPress={handleCreateCard}
          disabled={isAddingCard}
        >
          Add Card
        </Button>
      </View>
      <ScrollView horizontal pagingEnabled style={sharedStyles.fullHeight}>
        {sortedColumns.map((column, columnIndex) => {
          if (selectedColumnId === column.id) {
            return (
              <EditColumnForm
                key={column.id}
                column={column}
                board={board}
                onChange={onChangeColumn}
                onCancel={() => setSelectedColumnId(null)}
                style={columnWidthStyle}
              />
            );
          } else {
            return (
              <Column
                key={column.id}
                column={column}
                board={board}
                onEdit={() => setSelectedColumnId(column.id)}
                selectedCardId={selectedCardId}
                onSelectCard={card => showDetail(card.id)}
                onChangeCard={onChangeCard}
                onCancelEdit={hideDetail}
              />
            );
          }
        })}
        <View style={[columnWidthStyle, sharedStyles.columnPadding]}>
          <View style={responsiveButtonContainerStyle}>
            <Button
              mode="link"
              icon="plus"
              onPress={handleCreateColumn}
              disabled={isAddingColumn}
            >
              Add Column
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    margin: 8,
  },
});

function getInitialFieldValues(elements) {
  const fieldsWithInitialValues = elements.filter(
    e =>
      e.attributes['element-type'] === ELEMENT_TYPES.FIELD.key &&
      e.attributes['initial-value'] !== null,
  );
  const initialValueEntries = fieldsWithInitialValues.map(field => {
    const {'data-type': dataType, 'initial-value': initialValue} =
      field.attributes;
    const resolvedValue = Object.values(VALUES)
      .find(v => v.key === initialValue)
      ?.call(dataType);
    return [field.id, resolvedValue];
  });
  return Object.fromEntries(initialValueEntries);
}
