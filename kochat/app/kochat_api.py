# Copyright 2020 Kochat. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from typing import List

from flask import Flask
from kochat.app.scenario import Scenario
from kochat.app.scenario_manager import ScenarioManager
from kochat.data.dataset import Dataset
from kochat.decorators import api


@api
class KochatApi:

    def __init__(self,
                 dataset: Dataset,
                 embed_processor,
                 intent_classifier,
                 entity_recognizer,
                 scenarios: List[Scenario] = None):

        """
        Flask를 이용해 구현한 RESTFul API 클래스입니다.

        :param dataset: 데이터셋 객체
        :param embed_processor: 임베딩 프로세서 객체 or (, 학습여부)
        :param intent_classifier: 인텐트 분류기 객체 or (, 학습여부)
        :param entity_recognizer: 개체명 인식기 객체 or (, 학습여부)
        :param scenarios : 시나리오 리스트 (list 타입)
        """

        self.app = Flask(__name__)
        self.app.config['JSON_AS_ASCII'] = False

        self.dataset = dataset
        self.scenario_manager = ScenarioManager()
        self.dialogue_cache = {}

        self.embed_processor = embed_processor[0] \
            if isinstance(embed_processor, tuple) \
            else embed_processor

        self.intent_classifier = intent_classifier[0] \
            if isinstance(intent_classifier, tuple) \
            else intent_classifier

        self.entity_recognizer = entity_recognizer[0] \
            if isinstance(entity_recognizer, tuple) \
            else entity_recognizer

        if isinstance(embed_processor, tuple) \
                and len(embed_processor) == 2 and embed_processor[1] is True:
            self.__fit_embed()

        if isinstance(intent_classifier, tuple) \
                and len(intent_classifier) == 2 and intent_classifier[1] is True:
            self.__fit_intent()

        if isinstance(entity_recognizer, tuple) \
                and len(entity_recognizer) == 2 and entity_recognizer[1] is True:
            self.__fit_entity()

        for scenario in scenarios:
            self.scenario_manager.add_scenario(scenario)
            scenario.addemder(self.embed_processor)

        self.__build()

    def __build(self):
        """
        flask 함수들을 build합니다.
        """

        @self.app.route('/{}/<uid>/<text>'.format(self.request_chat_url_pattern), methods=['GET'])
        def request_chat(uid: str, text: str) -> dict:
            """
            문자열을 입력하면 intent, entity, state, answer 등을 포함한
            딕셔너리를 json 형태로 반환합니다.

            :param uid: 유저 아이디 (고유값)
            :param text: 유저 입력 문자열
            :return: json 딕셔너리
            """

            prep = self.dataset.load_predict(text, self.embed_processor)
            intent = self.intent_classifier.predict(prep, calibrate=False)
            print('reuqe intent', intent)
            entity = self.entity_recognizer.predict(prep)
            text = self.dataset.prep.tokenize(text, train=False)
            print('requrst entity',entity)
            print('request text',text)

            if intent!='accident':
                entity=[]
                text=[]

            self.dialogue_cache[uid] = self.scenario_manager.apply_scenario(intent, entity, text)

            print('request__dialog:', self.dialogue_cache[uid])
            return self.dialogue_cache[uid]

        @self.app.route('/{}/<uid>/<text>'.format(self.fill_slot_url_pattern), methods=['GET'])
        def fill_slot(uid: str, text: str) -> dict:
            """
            이전 대화에서 entity가 충분히 입력되지 않았을 때
            빈 슬롯을 채우기 위해 entity recognition을 요청합니다.

            :param uid: 유저 아이디 (고유값)
            :param text: 유저 입력 문자열
            :return: json 딕셔너리
            """
            prep = self.dataset.load_predict(text, self.embed_processor)
            entity = self.entity_recognizer.predict(prep)
            print('fill_slot new entity', entity)
            text = self.dataset.prep.tokenize(text, train=False)
            print('fill_slot_ new text', text)

            intent = self.intent_classifier.predict(prep, calibrate=False)
            print('fill_slot intent',intent)
            dicts = {}

            if intent=='accident':
                lists = [i.split('-')[1] for i in entity if len(i) > 1]
                print('새로들어온 엔티티중 0제외한것중 태깅 제외한 엔티티 리스트 만든거:',lists)


                for i in lists:
                    dicts[i] = []
                print('새로 들어온 데이터의 태깅없는 엔티 사전 만들기 ',dicts)

            # """새로 들어온 대답들의 사전 구축 outside를  자체 제외한 사전을 만들고
            # 룰루랄라 일하다가 추락했네 랄라라  0 loc acc o-> loc 일하닥  acc 추락하다 사전완성
            #      그 사전에 들어온 값들 넣어서 합쳐주기
            #   이유는  인텐트가 폴백이 아닐경우 엔티티체크 부분에서 중복 엔팉티를 확인 할것인데
            #    {기존 sloc:일하다가 s-acc:추락하다 }+{b-loc :건설 E-loc :현장  s-acc:떨어져서 injury:골절}
            #    에서 중복 사전을 만들면 맨마지막 값으로 키값이 변질되기 때문에 이후 들어오는 문장의 태깅은 합쳐준
            # """
                over = {}
                for t, e in zip(text, entity):
                    over[e] = t
                print('새로 들어온 엔티티와 텍스트를 매칭해서 사전만들기',over)

            # if 'O' in entity:
            #     del over['O']
            # print('새로들어온 데이터에 o있으면 매핑 딕셔너리에서 제거 over',over)

                for k, v in over.items():
                    for listk in dicts.keys():
                        if listk in k:
                            dicts[listk].append(v)
                print('dit 사전에 올리기 ',dicts)
                for k in dicts.keys():
                    dicts[k] = ' '.join(dicts[k])
                print('dit 사전에 올리ddd기 ', dicts)

            #
            # duplicate={}
            # #답변 분석으로 채운 정답 딕셔너리의 키와 밸루
            # for k,v in self.dialogue_cache[uid]['answer'].items():
            #     for dictk,dictv in dicts.items():#새로들어온 엔티티만 들어있는 리스트에서 하나씩 꺼내서
            #         print("딕셔너리  key 값:", k, '새로 들어온 답변의 엔티티 ', dictk)
            #         if  k==dictk and len(v)!=0:# 엔티티 타입 같고 밸루 값이 들어있다면 중복값
            #             print("엔티티 같고 밸루 중복 k:",k," ele: ",dictk," v :",v)
            #             duplicate[k]=dictv
            #
            #
            #         elif k in dictk and len(v)==0:# 엔티티 타입은같지만 밸루가 비어있을 경우  엔티티 채워줍니다.
            #             print("엔티티는 같지만 밸루가 비어있음 ")
            #             text= [dictv]+self.dialogue_cache[uid]['input']
            #             print('fill_slot_++text', text)
            #             entity = [dictk]+ self.dialogue_cache[uid]['entity']  # 이전에 저장된 dict 앞에 추가
            #             print('fill_slot_++entity', entity)
            #             self.dialogue_cache[uid] = self.scenario_manager.apply_scenario(intent, entity, text)
            #
            #
            # print("dup:",duplicate)
            # print("dup len",len(duplicate.keys()))
            # if(len(duplicate.keys())>0):
            #     self.dialogue_cache[uid]['state'] = 'REQUIRE_CHECK'
            #     self.dialogue_cache[uid]['dup']=duplicate

            text= self.dialogue_cache[uid]['input']+list(dicts.values())
            print('fill_slot_++text', text)
            entity =self.dialogue_cache[uid]['entity']+list(dicts.keys())  # 이전에 저장된 dict 앞에 추가
            print('fill_slot_++entity', entity)

            self.dialogue_cache[uid] = self.scenario_manager.apply_scenario(intent, entity, text)
            print('fill_slot_dialog:', self.dialogue_cache[uid])
            return self.dialogue_cache[uid]

        @self.app.route('/{}/<uid>/<text>'.format(self.duplicate_check), methods=['GET'])
        def dups(uid: str,text:str)->dict:
            print(text)
            if text=='네':
                for k in self.dialogue_cache[uid]['dup'].keys():
                    if k=='LOC':
                        self.dialogue_cache[uid]['answer']['LOC']=self.dialogue_cache[uid]['dup']['LOC']
                    if k=='ACC':
                        self.dialogue_cache[uid]['answer']['ACC'] = self.dialogue_cache[uid]['dup']['ACC']
                    if k=='INJURY':
                        self.dialogue_cache[uid]['answer']['INJURY'] = self.dialogue_cache[uid]['dup']['INJURY']

            print('sle',self.dialogue_cache[uid])
            required_entity = [k for k, v in self.dialogue_cache[uid]['answer'].items() if len(v) == 0]
            print('버튼 reeu',required_entity)

            if len(required_entity) == 0:
                self.dialogue_cache[uid]['state'] = 'SUCCESS'
            else :
                self.dialogue_cache[uid]['state'] = 'REQUIRE_' + required_entity[0]
            print(self.dialogue_cache[uid])

            return self.dialogue_cache[uid]



        @self.app.route('/{}/<text>'.format(self.get_intent_url_pattern), methods=['GET'])
        def get_intent(text: str) -> dict:
            """
            Intent Classification을 수행합니다.

            :param text: 유저 입력 문자열
            :return: json 딕셔너리
            """

            prep = self.dataset.load_predict(text, self.embed_processor)
            intent = self.intent_classifier.predict(prep, calibrate=False)
            return {
                'input': text,
                'intent': intent,
                'entity': None,
                'state': 'REQUEST_INTENT',
                'answer': None
            }

        @self.app.route('/{}/<text>'.format(self.get_entity_url_pattern), methods=['GET'])
        def get_entity(text: str) -> dict:
            """
            Entity Recognition을 수행합니다.

            :param text: 유저 입력 문자열
            :return: json 딕셔너리
            """

            prep = self.dataset.load_predict(text, self.embed_processor)
            entity = self.entity_recognizer.predict(prep)
            return {
                'input': text,
                'intent': None,
                'entity': entity,
                'state': 'REQUEST_ENTITY',
                'answer': None
            }

    def __fit_intent(self):
        """
        Intent Classifier를 학습합니다.
        """

        self.intent_classifier.fit(self.dataset.load_intent(self.embed_processor))

    def __fit_entity(self):
        """
        Entity Recognizr를 학습합니다.
        """

        self.entity_recognizer.fit(self.dataset.load_entity(self.embed_processor))

    def __fit_embed(self):
        """
        Embedding을 학습합니다.
        """

        self.embed_processor.fit(self.dataset.load_embed())
