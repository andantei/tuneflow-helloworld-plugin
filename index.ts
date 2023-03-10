import { TuneflowPlugin, WidgetType } from 'tuneflow';
import type { ParamDescriptor, Song, PitchWidgetConfig, TuneflowPluginTriggerData } from 'tuneflow';

/**
 * This is a simple hello world plugin to showcase how to write a TuneFlow plugin.
 *
 * For demo purpose, we are going to split the track into two voices, one treble
 * and one bass, based on the track and dividing pitch that the user provides.
 *
 * For more development resources, visit: https://github.com/andantei/tuneflow-devkit
 */
export class HelloWorld extends TuneflowPlugin {
  static providerId(): string {
    return 'my-provider-id';
  }

  static pluginId(): string {
    return 'my-plugin-id';
  }

  /** Specify here what params you need to run the plugin. */
  params(): { [paramName: string]: ParamDescriptor } {
    return {
      pitch: {
        displayName: {
          zh: '分割音高',
          en: 'Dividing Pitch',
        },
        defaultValue: 60,
        widget: {
          type: WidgetType.Pitch,
          config: {} as PitchWidgetConfig,
        },
        description: {
          zh: '将选中的轨道分成高低声部两轨：从此音高以上（包含）划分为高音 (Treble) 轨，其余音符划分为低音 (Bass) 轨。',
          en: 'Track will be divided into Treble and Bass: Treble contains notes higher(including) this pitch, and Bass contains notes lower than this pitch.',
        },
      },
    };
  }

  /** The main method to run our logic. */
  async run(song: Song, params: { [paramName: string]: any }): Promise<void> {
    // Read the user's input params.
    const pitch = this.getParam<number>(params, 'pitch');
    const trigger = this.getParam<TuneflowPluginTriggerData>(params, 'trigger');
    if (!trigger.entities) {
      throw new Error('triggering entities not found.');
    }
    const trackId = trigger.entities[0].trackId as string;

    // Find the track.
    const track = song.getTrackById(trackId);
    if (!track) {
      throw new Error('Track is not ready');
    }

    // Clone the original track to the new, empty bass track.
    const bassTrack = song.cloneTrack(track);
    if (!bassTrack) {
      throw new Error('Cannot clone the selected track');
    }
    // Remove non-bass notes from the bass track.
    for (const clip of bassTrack.getClips()) {
      const rawNotes = clip.getRawNotes();
      for (let i = rawNotes.length - 1; i >= 0; i -= 1) {
        if (rawNotes[i].getPitch() >= pitch) {
          clip.deleteNoteAt(i);
        }
      }
    }
    // Clone the original track to a new, empty treble track.
    const trebleTrack = song.cloneTrack(track);
    if (!trebleTrack) {
      throw new Error('Cannot clone the selected track');
    }

    // Remove non-treble notes from the bass track.
    for (const clip of trebleTrack.getClips()) {
      const rawNotes = clip.getRawNotes();
      for (let i = rawNotes.length - 1; i >= 0; i -= 1) {
        if (rawNotes[i].getPitch() < pitch) {
          clip.deleteNoteAt(i);
        }
      }
    }

    // Remove the original track.
    track.deleteFromParent();

    // That's it! The DAW will take over from this point and apply your changes
    // to the song.
  }
}
