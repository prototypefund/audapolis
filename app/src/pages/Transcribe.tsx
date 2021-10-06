import * as React from 'react';
import { Button, Link } from '../components/Controls';
import { useDispatch, useSelector } from 'react-redux';
import { abortTranscription, startTranscription } from '../state/transcribe';
import { TitleBar } from '../components/TitleBar';
import { AppContainer, MainCenterColumn } from '../components/Util';
import { RootState } from '../state';
import styled from 'styled-components';
import { openServersList, openManageServer } from '../state/nav';
import { useState } from 'react';

const Form = styled.div`
  padding: 20px;
  margin-bottom: 50px;
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 20px;
`;

export function TranscribePage(): JSX.Element {
  const dispatch = useDispatch();
  const file = useSelector((state: RootState) => state.transcribe.file) || '';
  const models = useSelector((state: RootState) =>
    Object.values(state.models.downloaded).flatMap((x) => x)
  );

  const [selectedModel, setSelectedModel] = useState(0);

  return (
    <AppContainer>
      <TitleBar />
      <MainCenterColumn>
        <Form>
          <span style={{ opacity: 0.5 }}>opened</span>
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {file.split('/').pop()}
          </span>

          <span style={{ opacity: 0.5 }}>Server</span>
          <Link style={{ gridColumn: '2 / 2' }} onClick={() => dispatch(openServersList())}>
            Manage Servers
          </Link>

          <span style={{ opacity: 0.5 }}>Transcription Model</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(parseInt(e.target.value))}
          >
            {models.map((model, i) => (
              <option key={i} value={i}>
                {model.lang} - {model.name}
              </option>
            ))}
          </select>

          <Link style={{ gridColumn: '2 / 2' }} onClick={() => dispatch(openManageServer())}>
            Download More Transcription Models
          </Link>
        </Form>

        <Button
          primary
          onClick={() =>
            dispatch(
              startTranscription({
                model: models[selectedModel],
              })
            )
          }
        >
          Start Transcribing
        </Button>
        <Button onClick={() => dispatch(abortTranscription())}>abort</Button>
      </MainCenterColumn>
    </AppContainer>
  );
}
