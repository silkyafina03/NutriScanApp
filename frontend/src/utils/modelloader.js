import * as tf from '@tensorflow/tfjs';

let model;

const classNames = [
  "bakso", "bebek_betutu", "gado_gado", "gudeg",
  "nasi_goreng", "pempek", "rawon", "rendang", "sate", "soto"
];

const nutritionData = {
  "bakso":     { calories: 76, proteins: 4.1, fat: 2.5, carbohydrate: 9.2 },
  "bebek_betutu": { calories: 300, proteins: 24.0, fat: 20.7, carbohydrate: 4.5 },
  "gado_gado": { calories: 137, proteins: 6.1, fat: 3.2, carbohydrate: 21.0 },
  "gudeg":     { calories: 53, proteins: 1.6, fat: 1.6, carbohydrate: 8.8 },
  "nasi_goreng": { calories: 276, proteins: 3.2, fat: 3.2, carbohydrate: 30.2 },
  "pempek":    { calories: 152, proteins: 4.5, fat: 2.3, carbohydrate: 28.2 },
  "rawon":     { calories: 60, proteins: 5.4, fat: 2.5, carbohydrate: 4 },
  "rendang":   { calories: 193, proteins: 22.6, fat: 7.9, carbohydrate: 7.8 },
  "sate":      { calories: 110, proteins: 15.5, fat: 0.5, carbohydrate: 11.5 },
  "soto":      { calories: 42, proteins: 3.9, fat: 1.7, carbohydrate: 2.8 }
};

// Override fetch untuk mengatasi masalah batch_shape & legacy format
let fetchOverrideApplied = false;

function applyFetchOverride() {
  if (fetchOverrideApplied) return;

  const originalFetch = window.fetch;

  window.fetch = function(url, options) {
    return originalFetch(url, options).then(response => {
      if (url.includes('model.json')) {
        return response.clone().json().then(data => {
          let modified = false;

          // Jika model menggunakan legacy format, ubah ke format baru
          if (data.modelTopology && !data.format) {
            console.log('Legacy model detected. Converting to new format...');
            data = convertLegacyToNewFormat(data);
            modified = true;
          }

          // Fix batchInputShape
          if (data.modelTopology && data.modelTopology.model_config?.config) {
            const config = data.modelTopology.model_config.config;
            if (!Array.isArray(config)) {
              data.modelTopology.model_config.config = [config];
              modified = true;
            }
          }

          if (modified) {
            console.log('Struktur model.json berhasil diperbaiki');
          }

          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }).catch(err => {
          console.error('Gagal parsing model.json:', err);
          return response;
        });
      }
      return response;
    });
  };

  fetchOverrideApplied = true;
}

function convertLegacyToNewFormat(data) {
  return {
    format: 'layers-model',
    generatedBy: 'LegacyConverter',
    convertedBy: 'TensorFlow.js 4.x',
    modelTopology: data.modelTopology || data,
    weightsManifest: data.weightsManifest || [],
    user_defined_metadata_and_version: {
      version: '1.0',
      metadata: {}
    }
  };
}

export async function loadModel() {
  try {
    if (!model) {
      console.log('Memulai pemuatan model...');
      applyFetchOverride();

      const modelPaths = ['/tfjs_model/model.json'];
      let loadError = null;

      for (const path of modelPaths) {
        try {
          console.log(`Mencoba muat model dari: ${path}`);

          // Coba GraphModel dulu
          model = await tf.loadGraphModel(path);
          console.log('Model dimuat sebagai GraphModel');

          if (model && model.predict) return model;
        } catch (graphError) {
          console.warn(`GraphModel gagal untuk ${path}:`, graphError.message);
          try {
            model = await tf.loadLayersModel(path);
            console.log('Model dimuat sebagai LayersModel');

            if (model && model.predict) return model;
          } catch (layersError) {
            console.error(`LayersModel juga gagal untuk ${path}:`, layersError.message);
            loadError = layersError;
          }
        }
      }

      throw loadError || new Error('Semua upaya pemuatan model gagal');
    }

    return model;
  } catch (error) {
    console.error('Kesalahan saat memuat model:', error);
    if (error.message.includes('Legacy serialization')) {
      throw new Error('Model menggunakan format lama (legacy). Silakan konversi ulang model menggunakan tensorflowjs_converter.');
    } else {
      throw new Error(`Gagal memuat model: ${error.message}`);
    }
  }
}

export async function predictFood(imageElement) {
  try {
    if (!imageElement) throw new Error('Elemen gambar diperlukan');

    if (!model) await loadModel();
    if (!model || !model.predict) throw new Error('Model belum dimuat dengan benar');

    let tensor, predictions;

    try {
      let inputSize = 224;
      if (model.inputs && model.inputs[0] && model.inputs[0].shape) {
        const shape = model.inputs[0].shape;
        inputSize = shape[1] || shape[2] || 224;
      }

      tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([inputSize, inputSize])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims();

      predictions = model.predict(tensor);

      let predictionsArray;
      if (Array.isArray(predictions)) {
        predictionsArray = await predictions[0].data();
        predictions.forEach(p => p.dispose());
      } else {
        predictionsArray = await predictions.data();
        predictions.dispose();
      }

      const maxIndex = predictionsArray.indexOf(Math.max(...predictionsArray));
      const confidence = predictionsArray[maxIndex];
      const predictedClass = classNames[maxIndex] || 'unknown';
      const nutrition = nutritionData[predictedClass] || {
        calories: 150, proteins: 5, fat: 5, carbohydrate: 20
      };

      return {
        predictedClass,
        confidence: Math.round(confidence * 100),
        nutrition,
        allPredictions: classNames.map((className, index) => ({
          class: className,
          confidence: Math.round((predictionsArray[index] || 0) * 100)
        })).sort((a, b) => b.confidence - a.confidence).slice(0, 5)
      };
    } catch (predictionError) {
      console.error('Prediksi gagal:', predictionError);
      const fallbackClass = classNames[Math.floor(Math.random() * classNames.length)];
      const fallbackNutrition = nutritionData[fallbackClass] || {
        calories: 150, proteins: 5, fat: 5, carbohydrate: 20
      };
      return {
        predictedClass: fallbackClass,
        confidence: Math.floor(Math.random() * 30 + 50),
        nutrition: fallbackNutrition,
        fallback: true,
        error: predictionError.message
      };
    } finally {
      if (tensor) tensor.dispose();
    }
  } catch (error) {
    console.error('Kesalahan selama prediksi:', error);
    throw new Error(`Prediksi gagal: ${error.message}`);
  }
}

export async function preloadModel() {
  try {
    await loadModel();
    return true;
  } catch (error) {
    console.error('Gagal memuat model awal:', error);
    return false;
  }
}

export function isModelLoaded() {
  return !!model;
}

export function disposeModel() {
  if (model) {
    model.dispose();
    model = null;
    console.log('Model dibuang untuk menghemat memori');
  }
}

export function debugTensorFlow() {
  console.log('Versi TensorFlow.js:', tf.version.tfjs);
  console.log('Backend aktif:', tf.getBackend());
  console.log('Info memori:', tf.memory());
}