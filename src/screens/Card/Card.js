import {useNavigation} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Appbar, Provider} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Card from '../../components/Card';
import CenterModal from '../../components/CenterModal';
import LoadingIndicator from '../../components/LoadingIndicator';
import ScreenBackground from '../../components/ScreenBackground';
import sharedStyles from '../../components/sharedStyles';
import {useBoard} from '../../data/boards';
import {useCard, useDeleteCard, useRefreshCards} from '../../data/cards';
import {useCurrentBoard} from '../../data/currentBoard';
import ElementList from '../Board/Element/ElementList';
import EditCardForm from './EditCardForm';

export default function CardScreen({route}) {
  const insets = useSafeAreaInsets();
  const {boardId} = useCurrentBoard();
  const {cardId} = route.params;
  const navigation = useNavigation();
  const [isEditingElements, setIsEditingElements] = useState(false);

  const {data: board, isLoading: isLoadingBoard} = useBoard(boardId);
  const {data: card, isLoading: isLoadingCard} = useCard({boardId, cardId});
  const refreshCards = useRefreshCards(board);
  const isLoading = isLoadingBoard || isLoadingCard;

  const closeModal = useCallback(() => {
    refreshCards();
    navigation.goBack();
  }, [navigation, refreshCards]);

  const {mutate: deleteCard} = useDeleteCard(card, board);
  const handleDeleteCard = useCallback(
    () => deleteCard(null, {onSuccess: closeModal}),
    [closeModal, deleteCard],
  );

  const renderButtonControls = useCallback(
    () => (
      <>
        <Appbar.Action
          accessibilityLabel={
            isEditingElements ? 'Done Editing Elements' : 'Edit Elements'
          }
          icon="wrench"
          onPress={() => setIsEditingElements(on => !on)}
        />
        {!isEditingElements && (
          <Appbar.Action
            accessibilityLabel="Delete Card"
            icon="delete"
            onPress={handleDeleteCard}
          />
        )}
      </>
    ),
    [isEditingElements, handleDeleteCard],
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => renderButtonControls(),
    });
  }, [navigation, renderButtonControls]);

  function renderContents() {
    if (isLoading) {
      return <LoadingIndicator />;
    } else if (isEditingElements) {
      return (
        <View style={[styles.container, sharedStyles.fill]}>
          <ElementList board={board} />
        </View>
      );
    } else {
      return (
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.container,
            {paddingBottom: insets.bottom},
          ]}
          scrollIndicatorInsets={{bottom: insets.bottom}}
        >
          {card && (
            <EditCardForm card={card} board={board} onClose={closeModal} />
          )}
        </KeyboardAwareScrollView>
      );
    }
  }

  return (
    <CardWrapper closeModal={closeModal}>
      {Platform.OS !== 'android' && (
        <View style={styles.headerRow}>
          <Appbar.BackAction
            onPress={closeModal}
            accessibilityLabel="Go back"
          />
          <View style={sharedStyles.spacer} />
          {renderButtonControls()}
        </View>
      )}
      {renderContents()}
    </CardWrapper>
  );
}

function CardWrapper({children, closeModal}) {
  return Platform.select({
    web: (
      <CenterModal onDismiss={closeModal}>
        <Card style={styles.wrapperCard}>{children}</Card>
      </CenterModal>
    ),
    default: (
      <Provider>
        <ScreenBackground>{children}</ScreenBackground>
      </Provider>
    ),
  });
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wrapperCard: {
    marginTop: 8,
  },
  container: {
    padding: 16,
  },
});
