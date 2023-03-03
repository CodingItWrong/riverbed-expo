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
import {useCard, useDeleteCard} from '../../data/cards';
import {useCurrentBoard} from '../../data/currentBoard';
import EditCardForm from './EditCardForm';
import ElementList from './Element/ElementList';

export default function CardScreen({route}) {
  const insets = useSafeAreaInsets();
  const {boardId} = useCurrentBoard();
  const {cardId} = route.params;
  const navigation = useNavigation();
  const [isEditingElements, setIsEditingElements] = useState(false);

  // we use this instead of isLoading or isFetching because we do need the individual card to be newly loaded (so we need to wait on fetching), but we don't want to re-trigger the loading indicator any time we click back into the browser to fetch
  const [isFirstLoaded, setIsFirstLoaded] = useState(true);

  const {data: board} = useBoard(boardId);
  const {data: card} = useCard({
    boardId,
    cardId,
    options: {
      onSuccess: () => setIsFirstLoaded(false),
    },
  });

  const closeModal = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const {mutate: deleteCard} = useDeleteCard(card, board);
  const handleDeleteCard = useCallback(
    () => deleteCard(null, {onSuccess: closeModal}),
    [closeModal, deleteCard],
  );

  const renderButtonControls = useCallback(() => {
    if (isEditingElements) {
      return (
        <Appbar.Action
          accessibilityLabel="Done Editing Elements"
          icon="check-bold"
          onPress={() => setIsEditingElements(on => !on)}
        />
      );
    } else {
      return (
        <>
          <Appbar.Action
            accessibilityLabel="Edit Elements"
            icon="wrench"
            onPress={() => setIsEditingElements(on => !on)}
          />
          <Appbar.Action
            accessibilityLabel="Delete Card"
            icon="delete"
            onPress={handleDeleteCard}
          />
        </>
      );
    }
  }, [isEditingElements, handleDeleteCard]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => renderButtonControls(),
    });
  }, [navigation, renderButtonControls]);

  function renderContents() {
    if (isFirstLoaded) {
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
            accessibilityLabel="Close card"
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
